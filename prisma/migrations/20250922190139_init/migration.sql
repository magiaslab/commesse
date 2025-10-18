-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MANAGER', 'CONTABILE', 'OPERATORE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'OPERATORE',
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" SERIAL NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "nomeCommerciale" TEXT,
    "partitaIva" TEXT,
    "codiceFiscale" TEXT,
    "indirizzo" TEXT,
    "cap" TEXT,
    "comune" TEXT,
    "provincia" TEXT,
    "pec" TEXT,
    "codiceDestinatario" TEXT,
    "referente" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" SERIAL NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "codiceFiscale" TEXT,
    "indirizzo" TEXT,
    "pec" TEXT,
    "referente" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commessa" (
    "id" SERIAL NOT NULL,
    "codice" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT,
    "clientId" INTEGER NOT NULL,
    "responsabileId" INTEGER,
    "budget" DOUBLE PRECISION,
    "dataInizio" TIMESTAMP(3),
    "dataFinePrev" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER,
    "clientId" INTEGER,
    "supplierId" INTEGER,
    "tipo" TEXT NOT NULL,
    "filenameOriginal" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "documentDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "uploadedByUserId" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocrText" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DDT" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER,
    "supplierId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descrizione" TEXT,
    "importo" DOUBLE PRECISION,
    "documentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DDT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER,
    "supplierId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "dataFattura" TIMESTAMP(3) NOT NULL,
    "importoTotale" DOUBLE PRECISION NOT NULL,
    "dataScadenza" TIMESTAMP(3) NOT NULL,
    "statoPagamento" TEXT NOT NULL DEFAULT 'da_pagare',
    "documentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceDDT" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "ddtId" INTEGER NOT NULL,

    CONSTRAINT "InvoiceDDT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scadenza" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dateDue" TIMESTAMP(3) NOT NULL,
    "dateCompleted" TIMESTAMP(3),
    "responsabile" TEXT,
    "importo" DOUBLE PRECISION,
    "documentRefId" INTEGER,
    "alertEmail" BOOLEAN NOT NULL DEFAULT true,
    "alertDaysBefore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scadenza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Commessa_codice_key" ON "public"."Commessa"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."Commessa" ADD CONSTRAINT "Commessa_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DDT" ADD CONSTRAINT "DDT_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DDT" ADD CONSTRAINT "DDT_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DDT" ADD CONSTRAINT "DDT_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceDDT" ADD CONSTRAINT "InvoiceDDT_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceDDT" ADD CONSTRAINT "InvoiceDDT_ddtId_fkey" FOREIGN KEY ("ddtId") REFERENCES "public"."DDT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Scadenza" ADD CONSTRAINT "Scadenza_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
