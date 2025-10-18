-- AlterTable
ALTER TABLE "public"."Scadenza" ADD COLUMN     "supplierId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "bic" TEXT,
ADD COLUMN     "cap" TEXT,
ADD COLUMN     "codiceAteco" TEXT,
ADD COLUMN     "codiceDestinatario" TEXT,
ADD COLUMN     "comune" TEXT,
ADD COLUMN     "giorniPagamento" INTEGER,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "modalitaPagamento" TEXT,
ADD COLUMN     "nomeCommerciale" TEXT,
ADD COLUMN     "provincia" TEXT;
