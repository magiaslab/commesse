-- CreateEnum
CREATE TYPE "public"."PreventivoStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "public"."PreventivoItemCategory" AS ENUM ('MATERIALI', 'MANODOPERA', 'GESTIONE');

-- CreateTable
CREATE TABLE "public"."Preventivo" (
    "id" SERIAL NOT NULL,
    "commessaId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "note" TEXT,
    "currentApprovedVersionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preventivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreventivoVersion" (
    "id" SERIAL NOT NULL,
    "preventivoId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "public"."PreventivoStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByUserId" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" INTEGER,
    "lockedAt" TIMESTAMP(3),
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMaterials" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOverheads" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBeforeTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "changeNote" TEXT,
    "documentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventivoVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreventivoItem" (
    "id" SERIAL NOT NULL,
    "preventivoVersionId" INTEGER NOT NULL,
    "category" "public"."PreventivoItemCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hours" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventivoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preventivo_currentApprovedVersionId_key" ON "public"."Preventivo"("currentApprovedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PreventivoVersion_preventivoId_versionNumber_key" ON "public"."PreventivoVersion"("preventivoId", "versionNumber");

-- AddForeignKey
ALTER TABLE "public"."Preventivo" ADD CONSTRAINT "Preventivo_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "public"."Commessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Preventivo" ADD CONSTRAINT "Preventivo_currentApprovedVersionId_fkey" FOREIGN KEY ("currentApprovedVersionId") REFERENCES "public"."PreventivoVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreventivoVersion" ADD CONSTRAINT "PreventivoVersion_preventivoId_fkey" FOREIGN KEY ("preventivoId") REFERENCES "public"."Preventivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreventivoVersion" ADD CONSTRAINT "PreventivoVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreventivoItem" ADD CONSTRAINT "PreventivoItem_preventivoVersionId_fkey" FOREIGN KEY ("preventivoVersionId") REFERENCES "public"."PreventivoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
