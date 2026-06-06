# Deployment

Mosaic is deployed as a Docker container on a VPS. Postgres runs in a sibling
container; pin images are stored in Supabase Storage.

## Architecture

| Component     | Where                                                                |
| ------------- | -------------------------------------------------------------------- |
| Next.js app   | `app` container (standalone build), published on a host port         |
| Database      | `postgres` container with a persistent volume                        |
| Migrations    | `migrate` one-off container (Prisma CLI), runs before the app starts |
| Image storage | Supabase Storage (public `pins` bucket)                              |

All three services are defined in [`docker-compose.prod.yml`](../docker-compose.prod.yml)
and built from the multi-stage [`Dockerfile`](../Dockerfile).

## Prerequisites

- A VPS with Docker Engine and the Docker Compose plugin.
- A domain pointing to the VPS (for HTTPS).
- A Supabase project with a **public** Storage bucket named `pins`
  (see [the storage setup](#image-storage-supabase)).

## 1. Configuration

Clone the repository on the server, then create `.env.production` from the
template:

```bash
cp .env.production.example .env.production
```

Fill it in:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — credentials for the
  Postgres container.
- `DATABASE_URL` — built from the values above, with the host `postgres`:
  `postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public`
- `AUTH_SECRET` — generate one with `openssl rand -base64 32`.
- `AUTH_URL` and `NEXT_PUBLIC_APP_URL` — your public HTTPS URL.
- `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_STORAGE_BUCKET` — see below.

`.env.production` is gitignored and must never be committed.

### Image storage (Supabase)

1. In the Supabase dashboard, create a **public** bucket named `pins`
   (Storage → New bucket → Public bucket).
2. Project Settings → API: copy the **Project URL** (`SUPABASE_URL`) and the
   **`service_role` key** (`SUPABASE_SERVICE_ROLE_KEY`). The service-role key is
   used server-side only and must stay secret.

## 2. First deployment

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

This builds the images, starts Postgres, runs `prisma migrate deploy` (the
`migrate` service) and then starts the app once migrations have completed.

The app listens on `APP_PORT` (default `3000`) on the host. New accounts are
created through the app's sign-up flow; there is no demo seed in production.

## 3. HTTPS reverse proxy

Run a reverse proxy in front of the app for TLS. Caddy is the simplest:

```caddyfile
your-domain.com {
  reverse_proxy localhost:3000
}
```

Caddy obtains and renews certificates automatically. An nginx + Certbot setup
works equally well; just proxy `your-domain.com` to `http://localhost:3000`.

> The app sets `trustHost: true` so Auth.js trusts the proxied host. Make sure
> `AUTH_URL` and `NEXT_PUBLIC_APP_URL` match the public HTTPS URL.

## 4. Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

The `migrate` service re-applies any new migrations before the app restarts.

## 5. Database backups

Dump the database from the Postgres container:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

Restore with `psql` into the running container. The data lives in the `pgdata`
named volume, which persists across container restarts and rebuilds.

## Troubleshooting

- **`UntrustedHost` errors** — ensure `AUTH_URL` matches the public URL and the
  proxy forwards the `Host` header.
- **Images not loading** — the bucket must be public and the host is allowed by
  `next.config.ts` (`*.supabase.co`).
- **App can't reach the database** — `DATABASE_URL` must use the `postgres`
  service hostname, not `localhost`.
- **Logs** — `docker compose -f docker-compose.prod.yml logs -f app`.
