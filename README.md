# Tablón de Reservas — SaaS Booking Platform

<div align="center">

**🇬🇧 English · 🇫🇷 Français · 🇪🇸 Español**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🇬🇧 English

### Complete SaaS booking platform for small businesses

A full-featured multi-tenant SaaS application for managing reservations, clients and daily operations. Designed for small businesses and independent professionals: hair salons, clinics, coaches, repair shops, and more.

**Features:**
- **Professional calendar** — appointment management, availability, cancellations, conflict detection, search
- **CRM** — client records, booking history, internal notes, loyalty tracking
- **Services management** — duration, price, buffers, per-service availability
- **Team management** — roles, schedules, individual availability, invitations
- **Resources** — shared spaces and equipment management
- **Automated reminders** — email and SMS via Twilio
- **Billing** — VAT/tax configuration, invoice foundation, Stripe-ready
- **Analytics** — revenue, cancellation rate, occupancy, top services
- **Full customization** — logo, colors, cancellation policy, language
- **Public booking page** — each business gets `/book/[slug]` for client self-booking
- **Multi-tenant** — complete data isolation per business

**How it was built:**
- Architecture and business logic designed with Microsoft Copilot
- UI and features built with Lovable (low-code)
- Code cleaned, optimized and made production-ready with Claude AI

---

## 🇫🇷 Français

### Plateforme SaaS complète de réservation pour petites entreprises

Application SaaS multi-tenant complète pour la gestion des réservations, clients et opérations quotidiennes. Conçue pour les petites entreprises et indépendants.

**Fonctionnalités :** calendrier professionnel, CRM clients, gestion des services et du personnel, ressources partagées, rappels automatiques e-mail/SMS (Twilio), facturation avec TVA (prête pour Stripe), analytique complète, personnalisation totale, page de réservation publique `/book/[slug]`, multi-tenant avec isolation des données.

---

## 🇪🇸 Español

### Plataforma SaaS completa de reservas para pequeñas empresas

Aplicación SaaS multi-tenant para gestión de reservas, clientes y operaciones diarias. Diseñada para pequeñas empresas e independientes.

**Funcionalidades:** calendario profesional, CRM de clientes, gestión de servicios y equipo, recursos compartidos, recordatorios automáticos email/SMS (Twilio), facturación con IVA (lista para Stripe), analítica completa, personalización total, página pública de reservas `/book/[slug]`, multi-tenant con aislamiento de datos.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TanStack Start + TypeScript + shadcn/ui |
| Backend | Cloudflare Workers (serverless) |
| Database | Supabase (PostgreSQL) |
| SMS/Email | Twilio |
| Payment ready | Stripe (integration scaffold included) |
| Auth | Supabase Auth |

## Setup

```bash
# Install dependencies
npm install

# Configure
cp .env.example .env
# Fill in Supabase URL, anon key, Twilio credentials

# Run development
npm run dev

# Deploy to Cloudflare
wrangler deploy
```

## Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## License

MIT
