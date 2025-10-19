-- CreateTable
CREATE TABLE "public"."CustomerInvoice" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER,
    "numero" TEXT NOT NULL,
    "dataFattura" TIMESTAMP(3) NOT NULL,
    "importoTotale" DOUBLE PRECISION NOT NULL,
    "dataIncasso" TIMESTAMP(3),
    "statoIncasso" TEXT NOT NULL DEFAULT 'da_incassare',
    "documentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerInvoice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomerInvoice" ADD CONSTRAINT "CustomerInvoice_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerInvoice" ADD CONSTRAINT "CustomerInvoice_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
