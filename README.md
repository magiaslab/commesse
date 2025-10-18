# Commesse – v0.1 (init)

> Prima milestone con scaffold, base dati e funzionalità minime per gestione commesse, documenti e scadenze.

## Obiettivi v0.1 (scope)

- Scaffold app Next.js (TypeScript, app-router) + Tailwind + shadcn/ui
- Prisma con Neon (schema minimo: users, clients, suppliers, commesse, documents, ddt, invoices, scadenze) + migrazione iniziale
- Auth (NextAuth + Prisma adapter) e ruoli base (admin, manager, contabile, operatore)
- CRUD anagrafiche (clienti, fornitori) e commesse (list + detail)
- Document upload (S3-compatible) per DDT e Fatture + DB link (no OCR)
- Logica fattura ↔ DDT (pivot) e creazione automatica scadenza pagamento
- Dashboard commessa base: riepilogo documenti, prossime scadenze, KPI semplici (budget vs fatturato), tab Scadenze con possibilità di definire alert email
- Sistema reminder semplice (serverless cron) che invia mail via Resend quando scadenza si avvicina
- README, env sample, seed minimale

## Stack tecnico

- Next.js (TypeScript, App Router), Tailwind CSS, shadcn/ui
- Prisma ORM con Postgres gestito su Neon
- NextAuth con Prisma Adapter per autenticazione e ruoli
- Storage S3-compatibile (es. AWS S3, Cloudflare R2 o MinIO) per upload documenti
- Servizio email: Resend per invio notifiche e reminder
- Cron serverless (es. Vercel/Cloudflare schedulers) per reminder scadenze

## Modello dati minimo (alto livello)

- users: account e profili, ruoli base (admin, manager, contabile, operatore)
- clients (anagrafica clienti)
- suppliers (anagrafica fornitori)
- commesse: progetto/commessa collegata a client, con budget e metadati
- documents: metadati documento (filename, path S3, tipo, riferimenti)
- ddt: documenti di trasporto, collegati a commessa
- invoices: fatture, collegate a commessa e pivot con DDT
- invoices_ddt (pivot): relazione molti-a-molti tra fatture e DDT
- scadenze: scadenze pagamento fatture (generate automaticamente alla creazione fattura)

## Funzionalità chiave

- Autenticazione e autorizzazione base per ruoli
- CRUD anagrafiche (clienti, fornitori)
- CRUD commesse (lista e dettaglio)
- Upload documenti DDT/Fatture verso S3 con salvataggio metadati
- Associazione fattura ↔ DDT (pivot), generazione scadenza
- Dashboard commessa: riepilogo documenti, prossime scadenze, KPI semplici (budget vs fatturato), tab Scadenze con alert email
- Reminder scadenze via cron serverless + Resend

## Deliverable v0.1

- Repo con scaffold Next.js + Tailwind + shadcn/ui
- Configurazione Prisma + Neon e migrazione iniziale schema minimo
- NextAuth con ruoli base e seed minimo utenti
- CRUD base per clienti, fornitori, commesse
- Upload documenti S3 + persistenza metadati
- Dashboard commessa base + tab Scadenze
- Serverless cron per reminder via Resend
- README aggiornato, `.env.example`, script seed minimale

## Roadmap di implementazione (sequenza suggerita)

1. Scaffold Next.js (TS, App Router), Tailwind, shadcn/ui
2. Setup Prisma + Neon, definizione schema minimo, migrazione iniziale
3. NextAuth + Prisma Adapter, definizione ruoli e guardie
4. CRUD anagrafiche (clienti, fornitori)
5. CRUD commesse (lista, dettaglio)
6. Upload documenti su S3 + salvataggio metadati in DB
7. Modello fatture ↔ DDT (pivot) + generazione scadenze
8. Dashboard commessa (KPI base, scadenze, documenti)
9. Cron serverless per reminder email via Resend
10. `.env.example` e seed minimale

## Note

- Nessun OCR nella v0.1: focus su upload, relazione e scadenze
- Background chiaro e uso colori per dettagli (coerenza UI)
- Icone tramite libreria coerente con stile (no emoji)

