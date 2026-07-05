# ADR 0002: Move to a shared reverse proxy on the VPS

**Status:** Accepted

## Context
ADR 0001 gave makop its own `caddy` service in `docker-compose.prod.yml`,
owning ports 80/443 and terminating TLS via a repo-local `Caddyfile`. That
pattern doesn't scale as more independent apps land on the same Hetzner VPS —
each one claiming 80/443 conflicts with the others.

The VPS has since been set up with a single central `caddy-docker-proxy`
instance that owns ports 80/443 for the whole box and routes to each app by
domain using Docker labels. It discovers apps over a shared external Docker
network, `caddy_net`. Another app has already been migrated to this model.

## Decision
Move makop's production compose file onto the shared proxy:

- Remove makop's own `caddy` service and the repo's `Caddyfile` entirely —
  TLS and port ownership are no longer makop's concern.
- The `backend` service (the app's only public HTTP surface, port 3000)
  joins both the `default` network and the external `caddy_net`, publishes no
  host ports, and carries the routing labels:
  ```yaml
  caddy: makop.tomaskrizek.cz
  caddy.reverse_proxy: "{{upstreams 3000}}"
  ```
- `db` stays on `default` only, so it's never reachable from `caddy_net`.
- `docker-compose.prod.yml` declares `caddy_net` as `external: true` — it is
  created once on the VPS, outside this repo's control.
- Local dev (`docker-compose.yml`) is unaffected: it never had a Caddy
  service and stays fully self-contained.

## Consequences
- makop no longer manages TLS certificates or binds 80/443 — one less moving
  part per app, and no port conflicts as more apps join the VPS.
- Deploying makop now has an external precondition: `caddy_net` must already
  exist on the host. This repo doesn't create it (another app's setup does),
  so a from-scratch VPS needs that network created once before makop's first
  deploy.
- The domain moves from the ADR 0001 placeholder (`makop.example.com`) to the
  real one, `makop.tomaskrizek.cz`, set via Docker labels instead of a
  Caddyfile.
- Supersedes the infra portion of [ADR 0001](0001-choose-stack.md); that
  ADR's stack choices (Node/TS/Fastify/Postgres/React) are unaffected.
