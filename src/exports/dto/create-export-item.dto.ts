import {
    IsString,
    IsNotEmpty,
    IsUUID,
    IsInt,
    Min,
    IsNumber,
    IsOptional,
} from 'class-validator';

export class CreateExportItemDto {
    @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
    @IsNotEmpty({ message: 'El campo productId es obligatorio' })
    productId: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
    productName: string;

    @IsString({ message: 'La descripción del ítem debe ser un texto' })
    @IsNotEmpty({ message: 'La descripción del ítem es obligatoria' })
    description: string;

    @IsInt({ message: 'La cantidad solicitada debe ser un número entero' })
    @Min(1, { message: 'La cantidad solicitada debe ser al menos $constraint1' })
    quantityOrdered: number;


    @IsNumber({}, { message: 'El precio unitario debe ser un número' })
    @Min(0, { message: 'El precio unitario no puede ser negativo' })
    priceUnit: number;

    @IsNumber({}, { message: 'El precio total debe ser un número' })
    @Min(0, { message: 'El precio total no puede ser negativo' })
    @IsOptional()
    totalPrice: number;

    @IsString({ message: 'La moneda debe ser un texto' })
    @IsNotEmpty({ message: 'El campo currency es obligatorio' })
    currency: string;

    @IsUUID("4", { message: "El ID del almacén debe ser un UUID válido." })
    @IsNotEmpty({ message: "El ID del almacén es obligatorio para decrementar stock." })
    warehouseId: string;
}
