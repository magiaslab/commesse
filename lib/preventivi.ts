import { PrismaClient, PreventivoItemCategory } from '@prisma/client';

export function calculateLineTotal(input: {
  category: PreventivoItemCategory;
  quantity?: number | null;
  unitCost?: number | null;
  hours?: number | null;
  hourlyRate?: number | null;
  discountPercent?: number | null;
}): number {
  const quantity = Number(input.quantity ?? 1);
  const unitCost = Number(input.unitCost ?? 0);
  const hours = Number(input.hours ?? 0);
  const hourlyRate = Number(input.hourlyRate ?? 0);
  const discount = Math.max(0, Math.min(100, Number(input.discountPercent ?? 0)));
  if (input.category === 'MANODOPERA') {
    const labor = hours > 0 && hourlyRate > 0 ? hours * hourlyRate : quantity * unitCost;
    const after = labor * (1 - discount / 100);
    return round2(after);
  }
  const m = quantity * unitCost;
  const after = m * (1 - discount / 100);
  return round2(after);
}

export async function recalcVersionTotals(prisma: PrismaClient, versionId: number) {
  const version = await prisma.preventivoVersion.findUnique({
    where: { id: versionId },
    include: { items: true },
  });
  if (!version) return;
  let totalMaterials = 0;
  let totalLabor = 0;
  let totalOverheads = 0;
  for (const item of version.items) {
    const line = calculateLineTotal({
      category: item.category,
      quantity: item.quantity,
      unitCost: item.unitCost,
      hours: item.hours ?? undefined,
      hourlyRate: item.hourlyRate ?? undefined,
      discountPercent: (item as any).discountPercent ?? 0,
    });
    if (item.lineTotal !== line) {
      await prisma.preventivoItem.update({ where: { id: item.id }, data: { lineTotal: line } });
    }
    if (item.category === 'MATERIALI') totalMaterials += line;
    if (item.category === 'MANODOPERA') totalLabor += line;
    if (item.category === 'GESTIONE') totalOverheads += line;
  }
  const totalBeforeDiscount = round2(totalMaterials + totalLabor + totalOverheads);
  const globalDiscount = Math.max(0, Math.min(100, (version as any).discountPercent ?? 0));
  const totalBeforeTax = round2(totalBeforeDiscount * (1 - globalDiscount / 100));
  const vat = round2(totalBeforeTax * (version.vatRate ?? 0));
  const totalWithTax = round2(totalBeforeTax + vat);
  await prisma.preventivoVersion.update({
    where: { id: versionId },
    data: { totalMaterials, totalLabor, totalOverheads, totalBeforeTax, totalWithTax },
  });
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}


