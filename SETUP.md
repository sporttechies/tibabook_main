# TibaBook Setup Guide

The patient-facing Next.js app lives at the repository root. The hospital and admin portals remain in their own folders with independent package manifests; the Express API is a separate JavaScript service. You can move the portal folders out of this repository when you want to manage them as separate projects.

| App | Local URL | Directory |
| --- | --- | --- |
| Patient booking | `http://localhost:3000` | repository root |
| Hospital portal | `http://localhost:3000` | `apps/hospital` |
| Admin portal | `http://localhost:3000` | `apps/admin` |
| Express API | `http://localhost:4000` | `services/api` |

Run one frontend at a time. The root app's dev command is `next dev`; the hospital and admin projects also use `next dev` when run from their own directories. The API is plain JavaScript and uses PostgreSQL through the `pg` driver. Database scripts are not run automatically.

## Requirements

- Node.js 20.13 or newer
- pnpm 12.3.4 (declared in the root `package.json`)
- PostgreSQL, when you want database-backed features

## Install dependencies

From the repository root:

```sh
corepack enable
pnpm install
```

## Configure PostgreSQL and the API

1. Create a PostgreSQL database using your preferred provider.
2. Apply `database/schema.sql` to that database, then apply `database/seed.sql`. Run each script manually with your database tool; the application does not run migrations or seed data on startup.
3. Copy `services/api/.env.example` to `services/api/.env` and set the values for your environment:

```dotenv
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
DATABASE_SSL=true
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
CORS_ORIGINS=http://localhost:3000
PATIENT_APP_URL=http://localhost:3000
COOKIE_DOMAIN=
```

Use a unique, random `JWT_SECRET` of at least 32 characters. `DATABASE_SSL=true` enables certificate-verified TLS for the PostgreSQL connection; set it to `false` for a local database that does not use TLS. Keep real credentials in local environment files or your hosting provider's secret settings—never commit them.

The seed script inserts sample USD subscription prices ($49, $129, and $299 per month) and a $2.50 booking service fee. These are development values; review them for your launch market before accepting payments.

## Configure the patient app

Copy the root `.env.example` to `.env.local` and set the API URL:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For production, set `NEXT_PUBLIC_API_URL` to the deployed API origin. Update the API's `CORS_ORIGINS` to the exact frontend origins, and set `PATIENT_APP_URL` to the public patient app origin so hospital booking links and QR codes point to the right site. If the portals share a parent domain and need a shared session cookie, set `COOKIE_DOMAIN` to that parent (for example, `.example.com`); otherwise leave it blank.

## Run the patient app and API

Start the patient app from the repository root:

```sh
pnpm dev
```

In another terminal, start the API:

```sh
pnpm dev:api
```

If you move the API folder out to run it independently, install its dependencies there and run `pnpm dev` from that folder. The hospital and admin apps can likewise be installed and started from their respective folders with `pnpm dev`.

Check API liveness at `http://localhost:4000/api/health`. Its `databaseConfigured` value reports whether `DATABASE_URL` is set; it does not verify that the database is reachable or that the SQL schema has been applied. To verify persistence, use the booking and portal flows after completing the database setup above.

## Checks

From the repository root, type-check the patient app:

```sh
pnpm typecheck
```

The API is JavaScript; check its entry file syntax with:

```sh
node --check services/api/src/index.js
```

## Payments

Checkout is currently provider-neutral and no payment provider is configured, so the app does not make real charges. Configure and test a payment processor, currency, and launch-market pricing before enabling live patient or hospital subscription payments.
