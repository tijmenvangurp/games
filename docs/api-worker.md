# API Worker: auth-fundament

Deze map beschrijft de Worker onder de statische app. Issue #42 legde het fundament en `/api/health`; issue #43 voegt **Better Auth 1.7.10** toe met een ouderlogin via **Google OAuth** en **passkey**. Voortgang syncen (`/api/progress`) volgt in #44 en de volledige UI-, flag- en e2e-afwerking in #45.

`apps/api` is een eigen Nx-project met de tags `layer:app`, `scope:api` en `type:app`. De Worker mag alleen uit `entities` en `shared` importeren, nooit uit `features`, `pages` of `widgets`.

## Routing

`wrangler.jsonc` wijst `main` naar `apps/api/src/index.ts` en houdt de bestaande static assets uit `apps/games/dist`. Alleen `/api/*` gaat eerst naar de Worker:

```jsonc
"assets": {
  "directory": "./apps/games/dist",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

| Route         | Methode | Gedrag                                                                    |
| ------------- | ------- | ------------------------------------------------------------------------- |
| `/api/health` | `GET`   | `SELECT 1 AS ok` op D1; `200` of `503` bij een D1-fout                    |
| `/api/auth/*` | alle    | `auth.handler(request)`; `503` als de flag of auth-configuratie ontbreekt |
| overig        | alle    | JSON-`404` (`{"error":"not_found"}`)                                      |

Alle API-responses krijgen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer` en een strikte CSP (`default-src 'none'; frame-ancestors 'none'`). De statische `_headers` krijgen in #43 alleen `connect-src 'self'`; de volledige CSP-afwerking hoort bij #45.

## Auth-configuratie

`apps/api/src/auth.ts` bouwt Better Auth lui op, per D1-binding gecachet:

| Optie                                 | Waarde                                                          |
| ------------------------------------- | --------------------------------------------------------------- |
| `secret`                              | `env.BETTER_AUTH_SECRET`                                        |
| `baseURL`                             | `env.BETTER_AUTH_URL` (genormaliseerd naar de origin)           |
| `database`                            | `env.DB` (ingebouwde D1-ondersteuning, geen Drizzle)            |
| `trustedOrigins`                      | alleen de publieke origin                                       |
| `socialProviders.google`              | `env.GOOGLE_CLIENT_ID` / `env.GOOGLE_CLIENT_SECRET`             |
| `plugins`                             | `passkey({ rpID, rpName: "Spellen", origin })`                  |
| `rateLimit.storage`                   | `"database"` (`rateLimit`-tabel)                                |
| `advanced.ipAddress.ipAddressHeaders` | `["cf-connecting-ip"]`                                          |
| `telemetry`                           | `{ enabled: false }`                                            |
| `session`                             | 7 dagen, `updateAge` 1 dag, geen cookie-cache                   |
| Cookies                               | `HttpOnly`, `SameSite=Lax`, `Secure` op https, prefix `spellen` |

Er is **geen** e-mail/wachtwoord, magic link of kindlogin. Kinderen gebruiken de bestaande lokale profielen.

De route geeft een nette JSON-`503` (`{"error":"auth_unavailable"}`) als `ACCOUNTS_ENABLED` niet `"true"` is of als een van de secrets ontbreekt. Er wordt dan geen Better Auth-instantie aangemaakt.

## Secrets en vars

Zet deze waarden **niet** in de repo. `BETTER_AUTH_URL` is een gewone var; de rest zijn Workers-secrets.

| Naam                   | Soort  | Voorbeeld / opmerking                                         |
| ---------------------- | ------ | ------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Secret | 32+ tekens, hoge entropie; `wrangler secret put`              |
| `GOOGLE_CLIENT_ID`     | Secret | uit de Google-console                                         |
| `GOOGLE_CLIENT_SECRET` | Secret | uit de Google-console                                         |
| `BETTER_AUTH_URL`      | Var    | publieke origin, bijvoorbeeld `https://games.example.invalid` |
| `ACCOUNTS_ENABLED`     | Var    | `"false"` tot de eigenaar de uitrol start; dan `"true"`       |

Lokaal gebruik je een genegeerd `.dev.vars`-bestand:

```sh
ACCOUNTS_ENABLED=true
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=<lokaal gegenereerd, 32+ tekens>
GOOGLE_CLIENT_ID=<lokaal testaccount>
GOOGLE_CLIENT_SECRET=<lokaal testaccount>
```

`.dev.vars` staat in `.gitignore`. Voeg nooit echte waarden toe aan `wrangler.jsonc`, documentatie of tests.

## Google-console

Registreer in Google Cloud Console bij de OAuth-client exact deze redirect-URI:

```text
${BETTER_AUTH_URL}/api/auth/callback/google
```

Dus bijvoorbeeld `https://games.example.invalid/api/auth/callback/google`. Zonder die regel faalt de tokenuitwisseling. Gebruik alleen de standaardscopes `openid`, `email` en `profile`.

De Google-knop stuurt de browser naar Google; de Worker wisselt de code server-side in. Dat is de bewuste uitzondering op "geen externe requests" uit ADR 0012/0013. Er worden **geen remote avatars** gerenderd: de accountpagina gebruikt de lokale avatar-set.

## Passkey-RP en domeingebondenheid

De RP-ID is de hostname van `BETTER_AUTH_URL`, dus `new URL(BETTER_AUTH_URL).hostname`:

- lokaal: `localhost`
- productie: bijvoorbeeld `games.example.invalid`

Passkeys zijn aan die RP-ID gebonden. Een passkey die op een preview- of `workers.dev`-host is geregistreerd, werkt **niet** op de productie-origin en andersom. Kies de definitieve origin voordat je passkeys uitrolt. Bij een domeinwissel moeten passkeys opnieuw worden geregistreerd.

Passkey-registratie gebeurt in deze stap vanuit een bestaande sessie (eerst Google). Daarna kan de ouder met de passkey inloggen. Beide methoden hangen zo aan hetzelfde ouderaccount. Een passkey-first flow zonder sessie is bewust niet gebouwd: die vraagt een aparte `resolveUser`-route en een e-mailveld.

## D1 en migraties

Migraties staan in `apps/api/migrations/`:

| Bestand             | Inhoud                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `0001_app_meta.sql` | `app_meta`                                                                                |
| `0002_auth.sql`     | Better Auth-tabellen `user`, `session`, `account`, `verification`, `passkey`, `rateLimit` |

`0002_auth.sql` is gegenereerd met de Better Auth 1.7.10 Kysely/SQLite-generator voor de core-tabellen, de passkey-plugin en `rateLimit.storage = "database"`. Alle statements zijn idempotent (`IF NOT EXISTS`) en veilig voor een nieuwe database. Better Auth controleert het schema bij initialisatie; ontbrekende tabellen of kolommen laten requests falen.

Lokaal:

```sh
corepack pnpm exec wrangler d1 migrations apply DB --local
corepack pnpm exec wrangler dev
```

Productie (pas doen als de eigenaar de D1-resources aanmaakt en de placeholders vervangt):

```sh
corepack pnpm exec wrangler d1 create games
# vul de echte database_id in wrangler.jsonc in
corepack pnpm exec wrangler d1 migrations apply DB --remote
```

Workers Builds voert **geen** `wrangler d1 migrations apply` uit. Migreer vóór de deploy; laat de Worker niet bij de eerste request migreren.

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

## Client en `/account`

`libs/features/auth` bevat de same-origin client (`createAuthClient()` uit `better-auth/react`) en de account-UI. `libs/pages/account` is de minimale route `/account`. De route is **nog niet** aan het spelmenu gekoppeld; dat hoort bij #45.

De UI toont:

- "Inloggen met Google";
- "Inloggen met passkey" (alleen als de browser WebAuthn ondersteunt);
- na inloggen de naam en het e-mailadres van de ouder, plus "Passkey toevoegen" en "Uitloggen".

De knoppen zijn minimaal 56 px hoog (`size="lg"`), gebruiken `aria`-labels en een `role="alert"`/`role="status"` voor fouten. Er is geen remote avatar.

## Flags

- `ACCOUNTS_ENABLED=false` staat in productie en in `previews.vars`. De auth-route antwoordt met een JSON-503 tot de eigenaar de flag op `"true"` zet **en** de secrets heeft gezet.
- `VITE_ACCOUNTS_ENABLED` bestaat nog niet; de route zichtbaar maken en de build-time flag horen bij #45.

## Checks

```sh
corepack pnpm run typecheck   # games + api (aparte tsconfig.worker.json)
corepack pnpm run build       # games + api (wrangler deploy --dry-run)
corepack pnpm exec vitest run --project api
corepack pnpm exec vitest run --project web tests/web/account-screen.test.tsx
corepack pnpm run format:check
corepack pnpm run fsd
corepack pnpm run quality
```

De Worker gebruikt `@cloudflare/workers-types` in `tsconfig.worker.json`, zonder DOM-lib. De health- en auth-routetests draaien in de bestaande Vitest-opzet met een fake D1. `@cloudflare/vitest-pool-workers` is bewust niet toegevoegd.

## Wat lokaal niet getest kan worden

- De volledige Google OAuth-flow vereist echte Google-clientcredentials en een bereikbare callback-URL. In CI en in deze repo staan geen credentials.
- De passkey-ceremonie vereist een browser met WebAuthn en een echte RP-origin (HTTPS of `localhost`). De unit-tests dekken de UI en de foutpaden, niet de WebAuthn-ceremonie.
- Better Auth's schema-validatie en D1-gedrag zijn niet met een echte D1 getest; de migratie is gegenereerd uit Better Auth 1.7.10 en moet vóór de eerste preview/login met `wrangler d1 migrations apply` worden toegepast.

## Volgende stappen (#44/#45)

- #44: `/api/progress/*`, `player`/`progress`/`progress_mutation`/`consent` en de sync-client.
- #45: `VITE_ACCOUNTS_ENABLED`, de menu-ingang, de volledige CSP- en headeraudit, e2e-tests en de uitrol achter de flag.
