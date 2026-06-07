# Realtime service

A standalone `socket.io` server that delivers direct messages in real time. It
shares the app's Postgres database and authenticates every connection with the
same Auth.js session as the web app. It runs as its own process/container next
to Next.js — it is **not** part of the Next build.

## Responsibilities

- Authenticate the WebSocket handshake by decoding the Auth.js session cookie
  with `AUTH_SECRET` (`auth.ts`).
- Join each socket to a room per conversation the user belongs to.
- `message:send` → authorize membership → persist the message + bump the
  conversation → broadcast `message:new` to the room (with an ack to the sender).
- `typing` → relay a typing indicator to the other participants.

`server.ts` is a dependency-injected factory (`createRealtimeServer`) so it is
unit-tested without a database or the web app; `index.ts` wires the real Prisma
client and the cookie verifier and starts listening.

## Environment

| Var                    | Required | Default          | Purpose                                                  |
| ---------------------- | -------- | ---------------- | -------------------------------------------------------- |
| `AUTH_SECRET`          | yes      | —                | Same value as the web app; decodes the session cookie    |
| `DATABASE_URL`         | yes      | —                | Same Postgres as the web app                             |
| `REALTIME_PORT`        | no       | `4001`           | Listen port                                              |
| `REALTIME_CORS_ORIGIN` | no       | `true` (reflect) | Allowed origin(s); set to your app origin in prod        |
| `REALTIME_REDIS_URL`   | no       | —                | Enables the Redis adapter for multi-instance (see below) |

## Local development

```bash
npm run dev:realtime   # tsx watch realtime/index.ts
# or run the app and the realtime server together:
npm run dev:all
```

The browser client (added in M4) connects with `withCredentials: true` so the
session cookie is sent on the handshake.

## Deployment (compose snippet to add yourself)

> Not added to `docker-compose.prod.yml` on purpose — wire it when ready.

```yaml
services:
  realtime:
    build:
      context: .
      dockerfile: realtime/Dockerfile
    environment:
      AUTH_SECRET: ${AUTH_SECRET}
      DATABASE_URL: ${DATABASE_URL}
      REALTIME_CORS_ORIGIN: ${APP_ORIGIN}
      # REALTIME_REDIS_URL: redis://redis:6379
    depends_on:
      - db
    restart: unless-stopped
    expose:
      - "4001"
```

### Reverse proxy (Nginx)

Proxy `/socket.io/` to the container on the same domain so the session cookie is
shared (no CORS):

```nginx
location /socket.io/ {
  proxy_pass http://realtime:4001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header Cookie $http_cookie;
}
```

## Presence

Online status is reference-counted in memory (a user is online while any of
their sockets is connected); on the last disconnect the user's `lastSeenAt` is
persisted. Clients query `presence:get` and subscribe to `presence:update`.

## Scaling to multiple instances

Set `REALTIME_REDIS_URL`, install `@socket.io/redis-adapter` + `redis`, and
attach the adapter at the marked spot in `index.ts` — rooms and broadcasts then
work across instances. Note: the in-memory presence map is per-instance, so
multi-instance presence needs a shared store (e.g. Redis) too.
