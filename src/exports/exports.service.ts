import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateExportDto } from './dto/create-export.dto';
import { UpdateExportDto } from './dto/update-export.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { FilterPaginationDto } from 'src/common/dto/filter-pagination.dto';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly inventoryClient: ClientProxy,
  ) { }

  async create(createExportDto: CreateExportDto) {
    const { orderNumber, modality, salePlace, deliveryModality, observations, clientId, createdBy, items } =
      createExportDto;

    if (!items || items.length === 0) {
      throw new RpcException('Debe incluir al menos un ítem para la salida.');
    }

    // 1. Validar duplicado de orderNumber
    const exist = await this.prisma.exportOrder.findUnique({
      where: { orderNumber },
    });
    if (exist) {
      throw new RpcException(`Ya existe una orden con orderNumber="${orderNumber}".`);
    }

    // 2. Verificar stock suficiente para cada ítem (request-response a INVENTORY_SERVICE).
    //    Asumimos que INVENTORY_SERVICE expone un patrón 'check_stock' que recibe { productId, quantity } y responde { ok: boolean, available: number } o lanza error si producto no existe.
    //    Ajusta el patrón según tu diseño.
    for (const it of items) {
      try {
        const payload = { productId: it.productId, warehouseId: it.warehouseId, quantity: it.quantityOrdered };
        // firstValueFrom para await de Observable
        const res: { ok: boolean; available: number } = await firstValueFrom(
          this.inventoryClient.send('check_stock', payload).pipe(timeout(5000)),
        );
        if (!res.ok) {
          throw new RpcException(
            `Stock insuficiente para producto ${it.productName} (ID: ${it.productId}). Disponibles: ${res.available}, requeridos: ${it.quantityOrdered}.`,
          );
        }
      } catch (err) {

        this.logger.error('Error al verificar stock en Inventario', err);
        throw new RpcException('Error al verificar stock en Inventario.');
      }
    }

    // 3. Crear la orden y sus items en una transacción local de Prisma
    //    Calculamos totalPrice en el servicio:
    const itemsDataForPrisma = items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      description: it.description,
      quantityOrdered: it.quantityOrdered,
      priceUnit: it.priceUnit,
      totalPrice: it.totalPrice ?? it.priceUnit * it.quantityOrdered,
      currency: it.currency,
      warehouseId: it.warehouseId, // Asegúrate de que tu modelo ExportOrderItem tenga este campo
    }));;

    let createdOrder;

    try {
      createdOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.exportOrder.create({
          data: {
            orderNumber,
            modality,
            salePlace: salePlace as any,
            deliveryModality: deliveryModality as any,
            observations,
            clientId,
            createdBy,
            items: {
              create: itemsDataForPrisma,
            },
          },
          include: { items: true },
        });
        return order;
      });
    } catch (err) {
      this.logger.error('Error al crear ExportOrder en BD', err);
      throw new RpcException('Error al crear la orden de salida.');
    }

    // 4. Ajustar stock: emitir eventos para decrementar stock en Inventario.
    //    Asumimos un patrón 'decrement_stock' que recibe { productId, quantity } y responde { ok: boolean } o no responde (fire-and-forget).
    //    Para mayor robustez, puedes usar request-response y confirmar que se ajustó correctamente; en caso de falla, debes compensar.
    //    Aquí usamos request-response para asegurar que se descuenta; si falla, eliminamos la orden creada.
    try {
      for (const it of items) {
        const payload = { productId: it.productId, quantity: it.quantityOrdered };
        // Request-response para decrementar: si el inventario responde ok=false o error, se compensa.
        const res: { ok: boolean } = await firstValueFrom(
          this.inventoryClient.send('decrement_stock', payload).pipe(timeout(5000)),
        );
        if (!res.ok) {
          throw new Error(`Inventario rechazó decrementar stock para producto ${it.productId}`);
        }
      }
    } catch (err) {
      this.logger.error('Error al decrementar stock en Inventario', err);

      // Compensación: eliminar la orden creada, porque no pudimos ajustar stock
      try {
        await this.prisma.exportOrder.delete({
          where: { id: createdOrder.id },
        });
      } catch (delErr) {
        this.logger.error(
          'Error al compensar borrando ExportOrder luego de fallo en Inventario',
          delErr,
        );
        // En este punto la BD quedó con una orden huérfana o no ajustada; podrías marcar un estado de “pendiente” o “requiere revisión manual”.
      }

      throw new RpcException({
        message: 'La orden no pudo completarse porque no se pudo ajustar el stock en Inventario. Intenta nuevamente o revisa manualmente.',
        status: 500,
      });
    }

    // 5. Retornar la orden creada con items
    return createdOrder;
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { page, limit, search, isActive } = filterPaginationDto;

    const filters: any[] = [];

    if (search) {
      filters.push({
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Si status viene definido, lo agregamos
    if (isActive !== undefined) {
      filters.push({ isActive });
    }

    // Si existen filtros, los combinamos en un AND; de lo contrario, la consulta no tiene filtro
    const whereClause = filters.length > 0 ? { AND: filters } : {};

    // Ejecutamos la consulta de conteo y búsqueda con el mismo whereClause
    const [totalExports, exports] = await Promise.all([
      this.prisma.exportOrder.count({
        where: whereClause,
      }),
      this.prisma.exportOrder.findMany({
        take: limit,
        skip: (page! - 1) * limit!,
        orderBy: { updatedAt: 'desc' },
        where: { ...whereClause, },
      }),
    ]);

    const lastPage = Math.ceil(totalExports / limit!);

    return {
      exports,
      meta: {
        page,
        lastPage,
        total: totalExports,
      },
    };
  }

  async findOne(id: string) {
    const exportOrder = await this.prisma.exportOrder.findUnique({
      where: { id },
      include: { items: true }, // Incluimos los items relacionados
    });



    if (!exportOrder) {
      throw new RpcException(`Export order with ID ${id} not found.`);
    }


    const totalPrice = exportOrder.items.reduce((sum, item) => sum + +item.totalPrice, 0);

    return {
      exportOrder: {
        ...exportOrder,
        totalPrice, // Calculamos el totalPrice sumando los items
      }
    };


  }

  update(id: string, updateExportDto: UpdateExportDto) {
    return `This action updates a #${id} export`;
  }

}
