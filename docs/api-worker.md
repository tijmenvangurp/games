# API Worker: fundament

Deze map beschrijft het Worker-fundament uit issue #42. Er is nog **geen auth, login of progress-API**; die volgen in #43/#44. `apps/api` is een eigen Nx-project met de tags `layer:app`, `scope:api` en `type:app`. De Worker mag alleen uit `entities` en `shared` importeren, nooit uit `features`, `pages` of `widgets`.

## Routing

`wrangler.jsonc` wijst `main` naar `apps/api/src/index.ts` en houdt de bestaande static assets uit `apps/games/dist`. Alleen `/api/*` gaat eerst naar de Worker:

```jsonc
"assets": {
  "directory": "./apps/games/dist",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

Beschikbare route:

| Route         | Methode | Gedrag                                                 |
| ------------- | ------- | ------------------------------------------------------ |
| `/api/health` | `GET`   | `SELECT 1 AS ok` op D1; `200` of `503` bij een D1-fout |
| overig        | alle    | JSON-`404` (`{"error":"not_found"}`)                   |

Alle API-responses krijgen `Content-Type: application/json`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer` en een strikte CSP (`default-src 'none'; frame-ancestors 'none'`). De statische `_headers` blijven ongemoeid; die CSP-wijziging hoort bij #45.

## D1 en migraties

De eerste migratie staat in `apps/api/migrations/0001_app_meta.sql` en maakt alleen `app_meta` aan. Auth- en progresstabellen komen later.

Lokaal:

```sh
corepack pnpm exec wrangler d1 migrations apply DB --local
corepack pnpm exec wrangler dev
```

Productie (pas doen als de eigenaar de D1-resources aanmaakt en de placeholder vervangt):

```sh
corepack pnpm exec wrangler d1 create games
# vul de echte database_id in wrangler.jsonc in
corepack pnpm exec wrangler d1 migrations apply DB --remote
```

## Placeholders die de eigenaar moet invullen

In `wrangler.jsonc` staan twee placeholders:

| Binding                                | Placeholder                            | Wanneer invullen                      |
| -------------------------------------- | -------------------------------------- | ------------------------------------- |
| `d1_databases[0].database_id`          | `00000000-0000-0000-0000-000000000000` | Na `wrangler d1 create games`         |
| `previews.d1_databases[0].database_id` | `00000000-0000-0000-0000-000000000001` | Na `wrangler d1 create games-preview` |

De preview-database is bewust apart: previews erven geen productiebindings en mogen nooit in de productie-D1 schrijven. Houd `database_name` en `database_id` in `previews.d1_databases` en `wrangler.preview-migrations.jsonc` gelijk. Migreer de preview-database vóór de preview-deploy:

```sh
corepack pnpm exec wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc
```

Er zijn in deze stap **geen** Cloudflare-resources aangemaakt en er is niet gedeployd. De echte id's zijn bewust niet in de repo opgenomen.

## Flags en secrets

- `ACCOUNTS_ENABLED=false` staat in productie en in `previews.vars`. De accountroutes bestaan nog niet; de flag voorkomt dat een latere route per ongeluk open staat.
- `BETTER_AUTH_SECRET` komt later als Workers-secret via `wrangler secret put`. Er staan geen secrets in de repo en er is geen `.dev.vars` toegevoegd.

## Checks

```sh
corepack pnpm run typecheck   # games + api (aparte tsconfig.worker.json)
corepack pnpm run build       # games + api (wrangler deploy --dry-run)
corepack pnpm exec vitest run --project api
corepack pnpm run format:check
corepack pnpm run quality
```

De Worker gebruikt `@cloudflare/workers-types` in `tsconfig.worker.json`, zonder DOM-lib. De health- en routertests draaien in de bestaande Vitest-opzet met een fake D1; `@cloudflare/vitest-pool-workers` is voor deze stap bewust niet toegevoegd. Daardoor is er geen echte lokale D1-integratietest en is `wrangler dev` nog niet in CI gedekt.
