-- CreateEnum
CREATE TYPE "MODALITY" AS ENUM ('REPOSICION', 'CONSIGNA', 'VENTA', 'COTIZACION');

-- CreateEnum
CREATE TYPE "DELIVERY_MODALITY" AS ENUM ('SUCURSAL', 'OFICINAS', 'TERMINAL', 'AEREOPUERTO', 'DESTINO', 'TRANSPORTADOR');

-- CreateEnum
CREATE TYPE "SALE_PLACE" AS ENUM ('LOCAL', 'INTERIOR');

-- CreateTable
CREATE TABLE "exportOrders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "modality" "MODALITY" NOT NULL,
    "salePlace" "SALE_PLACE" NOT NULL,
    "deliveryModality" "DELIVERY_MODALITY" NOT NULL,
    "observations" TEXT,
    "clientId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exportOrders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exportOrderItems" (
    "id" SERIAL NOT NULL,
    "exportOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "priceUnit" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exportOrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exportOrders_orderNumber_key" ON "exportOrders"("orderNumber");

-- AddForeignKey
ALTER TABLE "exportOrderItems" ADD CONSTRAINT "exportOrderItems_exportOrderId_fkey" FOREIGN KEY ("exportOrderId") REFERENCES "exportOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
