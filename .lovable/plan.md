## Goal

Add the automation, availability-locking and PDF-invoicing layer on top of the booking, dashboard and onboarding that already exist. The availability *calculation* is already implemented in `public.server.ts` in the requested order (duration → buffers → existing appointments → business hours → exceptions/vacation). This plan adds the missing pieces: race-safe locking, the cron-driven automations, Stripe webhooks, and PDF invoices.

## External services required (secrets)

The codebase is already wired for env-based integrations (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, optional Twilio). I'll request these via the secure secrets form. Every automation degrades gracefully when a secret is absent (it queues/logs instead of crashing), so the app keeps working while keys are added.

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — checkout, webhooks, invoices.
- `RESEND_API_KEY` — all customer/owner emails.
- Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`) — optional SMS; only used when `settings.sms_enabled` is on.

## Database changes (one migration)

1. **Double-booking lock**: enable `btree_gist`; add an `EXCLUDE` constraint on `appointments` over `(tenant_id, profesional_id WITH =, tstzrange(hora_inicio, hora_fin) WITH &&)` with `WHERE (estado <> 'cancelled' AND profesional_id IS NOT NULL)`, and a parallel one for `resource_id`. First confirmed booking wins; the loser gets a clean "slot taken" error.
2. **Correlative invoice numbers**: `invoice_counters(tenant_id, year, last_number)` + `next_invoice_number(tenant_id)` SECURITY DEFINER function returning a per-tenant, per-year correlative like `2026-0001` (atomic via `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`).
3. **Notification tracking**: add `kind text` (`confirmation` / `reminder_24h` / `reminder_1h` / `waitlist` / `trial_ending` / `payment_failed` / `payment_timeout`) and `error text` to `notifications` so reminders dedupe and we can audit sends.
4. **Payment timeout**: add `expires_at timestamptz` to `payments` (set to now + 15 min for pending Stripe payments).
5. **Waitlist confirm link**: add `confirm_token uuid default gen_random_uuid()` and `servicio_id`/slot fields already exist; add `notified_at timestamptz`.
6. Storage bucket `invoices` (private) + RLS on `storage.objects` so tenant admins can read their own invoices; PDFs are served to the dashboard via short-lived signed URLs.

## Server code

**Email/SMS helpers** (`src/lib/notify/email.server.ts`, `sms.server.ts`): thin Resend / Twilio gateway wrappers with branded HTML (business logo + colors). No-op + log when the key is missing.

**Invoice generation** (`src/lib/invoices/pdf.server.ts`): build the PDF with `pdf-lib` (pure-JS, Worker-safe) containing logo, business + client data, service description, net amount, configured IVA %, total, correlative number and date. Upload to the `invoices` bucket, store `pdf_url`/path on `invoices` + `payments`.

**Stripe webhook** (`src/routes/api/public/webhooks/stripe.ts`): verify the `Stripe-Signature` HMAC against `STRIPE_WEBHOOK_SECRET`, then handle:
- `payment_intent.succeeded` → mark payment paid, confirm the appointment, create the `invoices` row with correlative number, generate + store the PDF, email the client the confirmation with the PDF attached.
- `payment_intent.payment_failed` → mark payment failed, email the client.
- `customer.subscription.updated` → upsert `subscriptions` + sync `tenants.plan`.
- `customer.subscription.deleted` → downgrade tenant to `trial`/basic and mark subscription cancelled.

**Cron endpoints** under `src/routes/api/public/hooks/` (each idempotent, secured by being public-but-keyed and doing its own checks):
- `reminders` (every 5 min): find confirmed appointments 24h/1h out whose tenant has the reminder enabled and no existing `reminder_24h`/`reminder_1h` notification; email (and SMS if enabled) the client with details + magic link; record the notification.
- `payment-timeouts` (every 5 min): pending payments past `expires_at` → cancel appointment, free the slot, mark payment expired, email the client.
- `trial-ending` (daily): tenants whose `trial_ends_at` is ~3 days out and not yet notified → email the owner (admin via `user_roles` + `profiles`) with a link to the plan-selection screen.

Cron is wired with `pg_cron` + `pg_net` via the insert tool (stable `project--<id>.lovable.app` URL), per the scheduled-jobs guide.

**Waitlist auto-notify**: in `cancelBooking` (and the dashboard cancel path), after a slot frees up, find the first matching `waitlist` row (same service, `waiting`), email them a direct confirm link (`/book/{slug}?waitlist={confirm_token}`), and mark `notified`.

**Race-safe create**: wrap the `appointments` insert in `createBooking` to catch the exclusion-constraint violation and surface "Ese hueco acaba de ocuparse, elige otro".

## Dashboard

Billing page already lists invoices with PDF links — it will now show real correlative numbers and working signed PDF download links. No major UI rewrite; just ensure `pdf_url` resolves to a signed URL via a small server fn.

## Technical notes

- `pdf-lib` added via `bun add`.
- All server-only DB access uses `supabaseAdmin`; webhooks/cron live under `/api/public/*`.
- Stripe signature verification uses Node `crypto` (Worker-supported) with timing-safe compare.
- No Supabase Edge Functions — everything is TanStack server routes/functions.
