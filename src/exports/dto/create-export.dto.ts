import { Type } from "class-transformer";
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    IsArray,
    ValidateNested,
    IsEnum,
} from "class-validator";


import { CreateExportItemDto } from "./create-export-item.dto";
import { Modality } from "../types/modality.enum";
import { SalePlace } from "../types/sale-place.enum";
import { DeliveryModality } from "../types/delivery-modality.enum";

export class CreateExportDto {
    @IsOptional()
    @IsUUID("4", { message: "El ID debe ser un UUID válido." })
    id?: string;

    @IsString({ message: "El número de orden debe ser una cadena de texto." })
    @IsNotEmpty({ message: "El número de orden es obligatorio." })
    orderNumber: string;

    @IsEnum(Modality, {
        message: `La modalidad debe ser una de: ${Object.values(Modality).join(', ')}`,
    })
    modality: Modality;

    @IsEnum(SalePlace, {
        message: `El lugar de venta debe ser uno de: ${Object.values(SalePlace).join(', ')}`,
    })
    salePlace: SalePlace;

    @IsEnum(DeliveryModality, {
        message: `La modalidad de entrega debe ser una de: ${Object.values(DeliveryModality).join(', ')}`,
    })
    deliveryModality: DeliveryModality;

    @IsOptional()
    @IsString({ message: "Las observaciones deben ser texto." })
    observations?: string | null;

    @IsOptional()
    @IsUUID("4", { message: "El ID del cliente debe ser un UUID válido." })
    clientId?: string | null;

    @IsOptional()
    @IsUUID("4", { message: "El ID del creador debe ser un UUID válido." })
    createdBy?: string | null;

    @IsArray({ message: 'items debe ser un arreglo de ítems' })
    @ValidateNested({ each: true })
    @Type(() => CreateExportItemDto)
    @IsOptional()
    items?: CreateExportItemDto[];

}
