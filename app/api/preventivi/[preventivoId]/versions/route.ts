import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

// Crea una nuova versione DRAFT copiando l'ultima versione esistente (items inclusi)
export async function POST(_: Request, { params }: { params: { preventivoId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const preventivoId = Number(params.preventivoId);
    const last = await prisma.preventivoVersion.findFirst({
      where: { preventivoId },
      orderBy: { versionNumber: 'desc' },
      include: { items: true },
    });
    if (!last) return new NextResponse('Preventivo senza versioni', { status: 404 });
    const nextNumber = (last.versionNumber || 0) + 1;
    const created = await prisma.$transaction(async (tx) => {
      const v = await tx.preventivoVersion.create({
        data: {
          preventivoId,
          versionNumber: nextNumber,
          status: 'DRAFT',
          vatRate: last.vatRate,
        },
      });
      if (last.items.length > 0) {
        await tx.preventivoItem.createMany({
          data: last.items.map((it) => ({
            preventivoVersionId: v.id,
            category: it.category,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unitCost: it.unitCost,
            hours: it.hours,
            hourlyRate: it.hourlyRate,
            taxable: it.taxable,
            lineTotal: it.lineTotal,
            orderIndex: it.orderIndex,
          })),
        });
      }
      return v;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}




