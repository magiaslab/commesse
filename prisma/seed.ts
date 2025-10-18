import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Martina.2013', 10);
  // Utente admin
  const admin = await prisma.user.upsert({
    where: { email: 'cipriani.alessandro@gmail.com' },
    update: { password: passwordHash, role: Role.ADMIN, name: 'Admin' },
    create: {
      name: 'Admin',
      email: 'cipriani.alessandro@gmail.com',
      role: Role.ADMIN,
      password: passwordHash,
    },
  });

  // Clienti
  const client1 = await prisma.client.create({
    data: {
      ragioneSociale: 'Cliente Alfa S.r.l.',
      nomeCommerciale: 'Alfa',
      partitaIva: 'IT01234567890',
      indirizzo: 'Via Roma 1',
      cap: '00100',
      comune: 'Roma',
      provincia: 'RM',
      email: 'contabilita@alfacliente.it',
    },
  });
  const client2 = await prisma.client.create({
    data: {
      ragioneSociale: 'Cliente Beta S.p.A.',
      nomeCommerciale: 'Beta',
      partitaIva: 'IT09876543210',
      indirizzo: 'Corso Italia 10',
      cap: '20100',
      comune: 'Milano',
      provincia: 'MI',
      email: 'amministrazione@betacliente.it',
    },
  });

  // Fornitori
  const supplier1 = await prisma.supplier.create({
    data: {
      ragioneSociale: 'Fornitore Uno S.r.l.',
      partitaIva: 'IT11111111111',
      email: 'info@fornitore1.it',
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      ragioneSociale: 'Fornitore Due S.p.A.',
      partitaIva: 'IT22222222222',
      email: 'info@fornitore2.it',
    },
  });

  // Commessa (idempotente)
  const commessa = await prisma.commessa.upsert({
    where: { codice: 'C-2025-0001' },
    update: {},
    create: {
      codice: 'C-2025-0001',
      titolo: 'Commessa di prova',
      descrizione: 'Setup iniziale progetto',
      clientId: client1.id,
      responsabileId: admin.id,
      budget: 10000,
      dataInizio: new Date(),
    },
  });

  // Documenti di supporto
  const ddtDoc = await prisma.document.create({
    data: {
      commessaId: commessa.id,
      supplierId: supplier1.id,
      tipo: 'DDT',
      filenameOriginal: 'ddt-0001.pdf',
      s3Key: 'ddt/ddt-0001.pdf',
      mimetype: 'application/pdf',
      sizeBytes: 102400,
      documentDate: new Date(),
      documentNumber: 'DDT-0001',
      uploadedByUserId: admin.id,
    },
  });

  // DDT
  const ddt = await prisma.dDT.create({
    data: {
      commessaId: commessa.id,
      supplierId: supplier1.id,
      numero: 'DDT-0001',
      data: new Date(),
      descrizione: 'Materiale per avvio',
      importo: 500,
      documentoId: ddtDoc.id,
    },
  });

  // Documento fattura
  const fatturaDoc = await prisma.document.create({
    data: {
      commessaId: commessa.id,
      supplierId: supplier1.id,
      tipo: 'FATTURA',
      filenameOriginal: 'fattura-0001.pdf',
      s3Key: 'fatture/fattura-0001.pdf',
      mimetype: 'application/pdf',
      sizeBytes: 204800,
      documentDate: new Date(),
      documentNumber: 'FATT-0001',
      uploadedByUserId: admin.id,
    },
  });

  // Fattura collegata al DDT via pivot
  const fattura = await prisma.invoice.create({
    data: {
      commessaId: commessa.id,
      supplierId: supplier1.id,
      numero: 'FATT-0001',
      dataFattura: new Date(),
      importoTotale: 500,
      dataScadenza: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      documentoId: fatturaDoc.id,
      ddtLinks: {
        create: [{ ddtId: ddt.id }],
      },
    },
  });

  console.log({ admin, client1, client2, supplier1, supplier2, commessa, ddt, fattura });

  // Preventivo demo con 2 versioni
  const preventivo = await prisma.preventivo.create({
    data: {
      commessaId: commessa.id,
      currency: 'EUR',
      versions: {
        create: [
          {
            versionNumber: 1,
            status: 'APPROVED',
            vatRate: 0.22,
            items: {
              create: [
                { category: 'MATERIALI', description: 'Materiali base', quantity: 10, unit: 'pz', unitCost: 50, lineTotal: 500 },
                { category: 'MANODOPERA', description: 'Sviluppo', hours: 20, hourlyRate: 40, lineTotal: 800 },
                { category: 'GESTIONE', description: 'Spese generali', quantity: 1, unitCost: 100, lineTotal: 100 },
              ],
            },
            totalMaterials: 500, totalLabor: 800, totalOverheads: 100, totalBeforeTax: 1400, totalWithTax: 1708,
            approvedAt: new Date(),
          },
          {
            versionNumber: 2,
            status: 'DRAFT',
            vatRate: 0.22,
            items: { create: [{ category: 'MATERIALI', description: 'Aggiunta accessori', quantity: 5, unit: 'pz', unitCost: 30, lineTotal: 150 }] },
            totalMaterials: 150, totalLabor: 0, totalOverheads: 0, totalBeforeTax: 150, totalWithTax: 183,
          },
        ],
      },
    },
    include: { versions: true },
  });

  await prisma.preventivo.update({ where: { id: preventivo.id }, data: { currentApprovedVersionId: preventivo.versions.find(v => v.versionNumber === 1)!.id } });

  console.log({ preventivo });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
