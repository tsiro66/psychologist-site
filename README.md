# Κατερίνα Κρητικού — Ψυχολόγος

Στόχος: ιστότοπος της συμβούλου ψυχικής υγείας Κατερίνας Κρητικού (Ηλιούπολη, Αθήνα). Δημοσιευμένος ως στατική σελίδα + serverless APIs στο Cloudflare.

## Τι περιλαμβάνει

- Στατικές σελίδες: Αρχική, Σχετικά, Υπηρεσίες, Συχνές Ερωτήσεις, Κράτηση, Επικοινωνία, 404.
- Κράτηση ραντεβού με ημερολόγιο (Svelte) → Supabase (`bookings`, `blocked_slots`, `recurring_blocks`).
- Φόρμα επικοινωνίας → Resend email.
- Admin (`/admin/bookings`) προστατευμένο με Supabase Auth + middleware.
- Χάρτης Google Place στο footer με καρτέλα ωραρίου.
- View-transitions μεταξύ σελίδων.
- SEO: `robots.txt`, `sitemap.xml`, meta/OG/Twitter tags, JSON-LD (`Psychologist`, `FAQPage`).

## Stack

Astro 7 · Svelte 5 · Tailwind 4 · Supabase · Resend · Cloudflare (adapter `@astrojs/cloudflare`) · Wrangler.

## Ρύθμιση τοπικά

Απαιτείται Node ≥ 22.12 και pnpm.

```sh
pnpm install
cp .env.example .env   # ή ρύθμιση των μεταβλητών χειροκίνητα
pnpm dev               # http://localhost:4321
```

### Μεταβλητές περιβάλλοντος

| Μεταβλητή                | Εμβέλεια    | Περιγραφή                                    |
| ------------------------ | ----------- | -------------------------------------------- |
| `SUPABASE_URL`           | server      | URL του Supabase project                     |
| `SUPABASE_ANON_KEY`      | server      | anon/public key                              |
| `SUPABASE_SERVICE_ROLE_KEY` | server   | service-role key (μόνο server, ποτέ client)  |
| `RESEND_API_KEY`         | server      | κλειδί Resend για αποστολή email             |
| `CONTACT_EMAIL`          | server      | παραλήπτης email φόρμας/κράτησης             |
| `PUBLIC_GOOGLE_MAPS_KEY` | client      | κλειδί Google Maps JS API (με HTTP referrer restriction) |

> Οτιδήποτε με πρόθεμα `PUBLIC_` ενσωματώνεται στο client build — να έχει ενεργοποιημένους περιορισμούς στο Google Cloud Console.

## Scripts

| Εντολή          | Περιγραφή                                     |
| --------------- | --------------------------------------------- |
| `pnpm dev`      | dev server στη `localhost:4321`               |
| `pnpm build`    | production build στο `dist/`                  |
| `pnpm preview`  | preview του build τοπικά                      |
| `pnpm check`    | type-check (`astro check`)                    |

## Υποδομή Supabase

Οι migrations βρίσκονται στο `supabase/migrations/`:

- `0001_blocked_slots.sql` — πίνακας blocked slots
- `0002_recurring_blocks.sql` — εβδομαδιαία επαναλαμβανόμενα blocks
- `0003_bookings_unique.sql` — unique constraint (date, hour)
- `0004_bookings_blocked_trigger.sql` — trigger που αποτρέπει κράτηση σε blocked slot
- `0005_fix_trigger_cast.sql` — διόρθωση cast στο trigger

## Deploy (Cloudflare)

```sh
pnpm build
wrangler deploy
```

Οι server-only μεταβλητές μπαίνουν ως secrets, όχι στο `.env`:

```sh
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RESEND_API_KEY
```

Η `PUBLIC_GOOGLE_MAPS_KEY` μπαίνει στα Pages/Workers env vars (δίνει στο client build).

## Δομή

```text
src/
├── pages/            # σελίδες + API routes (api/, admin/)
├── components/       # Astro & Svelte components
├── layouts/          # MainLayout, AdminLayout
├── lib/              # supabase client, booking-utils, modal
├── middleware.ts     # προστασία /admin
└── styles/global.css
public/               # favicon, logo, font, robots.txt
supabase/migrations/  # SQL migrations
```
