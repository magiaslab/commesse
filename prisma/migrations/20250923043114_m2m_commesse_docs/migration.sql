-- AlterTable
ALTER TABLE "public"."Scadenza" ADD COLUMN     "invoiceId" INTEGER;

-- CreateTable
CREATE TABLE "public"."InvoiceCommessa" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "commessaId" INTEGER NOT NULL,

    CONSTRAINT "InvoiceCommessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DDTCommessa" (
    "id" SERIAL NOT NULL,
    "ddtId" INTEGER NOT NULL,
    "commessaId" INTEGER NOT NULL,

    CONSTRAINT "DDTCommessa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."InvoiceCommessa" ADD CONSTRAINT "InvoiceCommessa_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceCommessa" ADD CONSTRAINT "InvoiceCommessa_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DDTCommessa" ADD CONSTRAINT "DDTCommessa_ddtId_fkey" FOREIGN KEY ("ddtId") REFERENCES "public"."DDT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DDTCommessa" ADD CONSTRAINT "DDTCommessa_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
