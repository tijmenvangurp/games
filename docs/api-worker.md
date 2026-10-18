# API Worker: auth-fundament

Deze map beschrijft de Worker onder de statische app. Issue #42 legde het fundament en `/api/health`; issue #43 voegt **Better Auth 1.7.10** toe met een ouderlogin via **Google OAuth** en **passkey**. Issue #64 maakt **passkey een zelfstandige loginmethode**: een ouder kan zonder Google een account aanmaken en Google later koppelen. Voortgang syncen (`/api/progress`) volgt in #44 en de volledige UI-, flag- en e2e-afwerking in #45.

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

| Route                             | Methode | Gedrag                                                                    |
| --------------------------------- | ------- | ------------------------------------------------------------------------- |
| `/api/health`                     | `GET`   | `SELECT 1 AS ok` op D1; `200` of `503` bij een D1-fout                    |
| `/api/auth/capabilities`          | `GET`   | `{ "passkey": true, "google": boolean }`; `503` als auth uit staat        |
| `/api/auth/passkey-first/context` | `POST`  | Ondertekende, 5 minuten geldige context voor passkey-first registratie    |
| `/api/auth/*`                     | alle    | `auth.handler(request)`; `503` als de flag of auth-configuratie ontbreekt |
| overig                            | alle    | JSON-`404` (`{"error":"not_found"}`)                                      |

Alle API-responses krijgen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer` en een strikte CSP (`default-src 'none'; frame-ancestors 'none'`). De statische `_headers` krijgen in #43 alleen `connect-src 'self'`; de volledige CSP-afwerking hoort bij #45.

## Auth-configuratie

`apps/api/src/auth.ts` bouwt Better Auth lui op, per D1-binding gecachet:

| Optie                                 | Waarde                                                           |
| ------------------------------------- | ---------------------------------------------------------------- |
| `secret`                              | `env.BETTER_AUTH_SECRET` (verplicht)                             |
| `baseURL`                             | `env.BETTER_AUTH_URL` (verplicht, genormaliseerd naar de origin) |
| `database`                            | `env.DB` (ingebouwde D1-ondersteuning, geen Drizzle)             |
| `trustedOrigins`                      | alleen de publieke origin                                        |
| `socialProviders.google`              | alleen als `GOOGLE_CLIENT_ID` én `GOOGLE_CLIENT_SECRET` bestaan  |
| `plugins`                             | `passkey({ rpID, rpName: "Spellen", origin, registration })`     |
| `account.accountLinking`              | aan, `trustedProviders: ["google"]`, `allowDifferentEmails`      |
| `rateLimit.storage`                   | `"database"` (`rateLimit`-tabel)                                 |
| `advanced.ipAddress.ipAddressHeaders` | `["cf-connecting-ip"]`                                           |
| `telemetry`                           | `{ enabled: false }`                                             |
| `session`                             | 7 dagen, `updateAge` 1 dag, geen cookie-cache                    |
| Cookies                               | `HttpOnly`, `SameSite=Lax`, `Secure` op https, prefix `spellen`  |

Er is **geen** e-mail/wachtwoord, magic link of kindlogin. Kinderen gebruiken de bestaande lokale profielen. Google is optioneel; ontbreekt een van de Google-waarden, dan wordt `socialProviders.google` niet geregistreerd en blijft passkey werken. Een half ingevulde Google-configuratie wordt als "niet geconfigureerd" behandeld.

De route geeft een nette JSON-`503` (`{"error":"auth_unavailable"}`) als `ACCOUNTS_ENABLED` niet `"true"` is, of als `BETTER_AUTH_SECRET` of `BETTER_AUTH_URL` ontbreekt. Er wordt dan geen Better Auth-instantie aangemaakt. `/api/auth/capabilities` gebruikt dezelfde regel en vertelt de UI of de Google-knop zichtbaar moet zijn.

## Secrets en vars

Zet deze waarden **niet** in de repo. `BETTER_AUTH_URL` is een gewone var; de rest zijn Workers-secrets.

| Naam                   | Soort  | Voorbeeld / opmerking                                         |
| ---------------------- | ------ | ------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Secret | 32+ tekens, hoge entropie; `wrangler secret put`              |
| `BETTER_AUTH_URL`      | Var    | publieke origin, bijvoorbeeld `https://games.example.invalid` |
| `ACCOUNTS_ENABLED`     | Var    | `"false"` tot de eigenaar de uitrol start; dan `"true"`       |
| `GOOGLE_CLIENT_ID`     | Secret | optioneel; alleen nodig voor de Google-knop                   |
| `GOOGLE_CLIENT_SECRET` | Secret | optioneel; alleen nodig voor de Google-knop                   |

Lokaal gebruik je een genegeerd `.dev.vars`-bestand. Voor passkey-only is dit genoeg:

```sh
ACCOUNTS_ENABLED=true
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=<lokaal gegenereerd, 32+ tekens>
```

Voeg alleen voor Google tijdelijk een lokaal testaccount toe:

```sh
GOOGLE_CLIENT_ID=<lokaal testaccount>
GOOGLE_CLIENT_SECRET=<lokaal testaccount>
```

`.dev.vars` staat in `.gitignore`. Voeg nooit echte waarden toe aan `wrangler.jsonc`, documentatie of tests.

## Google-console

Registreer in Google Cloud Console bij de OAuth-client exact deze redirect-URI:

```text
${BETTER_AUTH_URL}/api/auth/callback/google
```

Dus bijvoorbeeld `https://games.example.invalid/api/auth/callback/google`. Zonder die regel faalt de tokenuitwisseling. Gebruik alleen de standaardscopes `openid`, `email` en `profile`. Sla deze sectie over als je alleen passkey-accounts wilt: zonder Google-credentials wordt er geen Google-provider geregistreerd.

De Google-knop stuurt de browser naar Google; de Worker wisselt de code server-side in. Dat is de bewuste uitzondering op "geen externe requests" uit ADR 0012/0013. Er worden **geen remote avatars** gerenderd: de accountpagina gebruikt de lokale avatar-set.

## Passkey-RP en domeingebondenheid

De RP-ID is de hostname van `BETTER_AUTH_URL`, dus `new URL(BETTER_AUTH_URL).hostname`:

- lokaal: `localhost`
- productie: bijvoorbeeld `games.example.invalid`

Passkeys zijn aan die RP-ID gebonden. Een passkey die op een preview- of `workers.dev`-host is geregistreerd, werkt **niet** op de productie-origin en andersom. Kies de definitieve origin voordat je passkeys uitrolt. Bij een domeinwissel moeten passkeys opnieuw worden geregistreerd.

Passkey-registratie werkt op twee manieren:

1. **Vanuit een bestaande sessie** (Google of passkey): de plugin gebruikt de sessie-user en hangt de nieuwe passkey aan dat account. De context wordt genegeerd.
2. **Passkey-first, zonder sessie:** dit is de zelfstandige route uit issue #64.

### Passkey-first flow

1. De client vraagt `POST /api/auth/passkey-first/context` aan. De Worker maakt een payload `{ v, userId, nonce, exp }` met een server-gegenereerd `userId` (`parent_<uuid>`) en 5 minuten geldigheid. De payload wordt met **HMAC-SHA256** en `BETTER_AUTH_SECRET` ondertekend en als `payload.signature` (base64url) teruggegeven.
2. De client roept `passkey.addPasskey({ context, createSession: true, name: "Ouderpasskey" })` aan. De officiële passkeyplugin vraagt registratie-opties op; `registration.resolveUser` verifieert de handtekening en expiry en levert alleen `{ id, name: "Ouder", displayName: "Ouder" }`. Er wordt **nog geen user-rij** aangemaakt.
3. Na een geslaagde WebAuthn-ceremonie verifieert `registration.afterVerification` de context opnieuw, controleert dat het `userId` bij de context hoort en dat de user nog niet bestaat, en maakt dan de user aan met een synthetische e-mail `passkey-<uuid>@invalid` en naam `Ouder`. Geen kindgegevens, geen echt e-mailadres.
4. De plugin schrijft de passkey en, met `createSession: true`, de sessie in dezelfde transactie. De ouder is meteen ingelogd.
5. Een tweede registratie met dezelfde context antwoordt met `PASSKEY_CONTEXT_ALREADY_USED`. Een ongeldige of verlopen context antwoordt met `INVALID_PASSKEY_CONTEXT`.

De context is bewust kortlevend en gebonden aan een server-gegenereerd user-id: een client kan geen willekeurige bestaande user claimen. De context-endpoint is publiek (registratie is open) en valt niet onder Better Auth's rate limiter; gebruik in productie Cloudflare-rate-limiting of een uitnodigingscode als misbruik een probleem wordt.

### Google later koppelen

Een ingelogde ouder (passkey-only) kan `linkSocial({ provider: "google", callbackURL: "/account" })` gebruiken. Better Auth's accountlinking staat aan met `trustedProviders: ["google"]`. Omdat het passkey-account een synthetische `@invalid`-e-mail heeft, staat `allowDifferentEmails: true` aan; de ouder is op dat moment al met de passkey geauthenticeerd. Het **`user`-id blijft gelijk**, er komt alleen een `account`-rij bij. De synthetische e-mail blijft staan en er worden geen remote avatars opgehaald.

Er is **geen e-mailherstel**. Herstel gaat via een tweede passkey op een ander toestel of, na koppeling, via "Inloggen met Google". De UI zegt dat expliciet.

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

- "Account aanmaken met passkey" (nieuw, zonder Google of e-mail);
- "Inloggen met passkey" (bestaand account);
- "Inloggen met Google", **alleen** als `/api/auth/capabilities` meldt dat Google is geconfigureerd;
- na inloggen de naam en (alleen bij een echt account) het e-mailadres, plus "Nog een passkey toevoegen", "Google koppelen" (als Google is geconfigureerd en nog niet gekoppeld) en "Uitloggen".

Een passkey-only account toont "Passkey-account zonder e-mail" in plaats van het synthetische adres. De UI legt uit dat er geen e-mailherstel is en dat herstel via een tweede passkey of een latere Google-koppeling gaat. De knoppen zijn minimaal 56 px hoog (`size="lg"`), gebruiken `aria`-labels en een `role="alert"`/`role="status"` voor fouten. Er is geen remote avatar.

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

De passkey-first-tests dekken:

- auth-configuratie zonder Google (passkey-only) en met Google;
- het ondertekenen en verifiëren van de context, inclusief verlopen, geknoeide en verkeerd ondertekende tokens;
- het aanmaken van de user **na** verificatie met een synthetische `@invalid`-e-mail;
- dubbele registratie met dezelfde context en een context die bij een ander user-id hoort;
- accountlinking van een passkey-user met Google via een in-memory Better Auth-adapter, inclusief controle dat het `user`-id gelijk blijft en er geen tweede user ontstaat;
- de UI voor aanmaken, inloggen, verbergen van Google, koppelen en foutpaden.

## Wat lokaal niet getest kan worden

- De volledige Google OAuth-flow vereist echte Google-clientcredentials en een bereikbare callback-URL. In CI en in deze repo staan geen credentials.
- De passkey-ceremonie vereist een browser met WebAuthn en een echte RP-origin (HTTPS of `localhost`). De unit-tests dekken de context-, user- en UI-flow en de foutpaden, maar niet de echte WebAuthn-ceremonie of een echte authenticator.
- Better Auth's schema-validatie en D1-gedrag zijn niet met een echte D1 getest; de migratie is gegenereerd uit Better Auth 1.7.10 en moet vóór de eerste preview/login met `wrangler d1 migrations apply` worden toegepast.
- De context-endpoint heeft geen eigen rate limiter. Test in productie of Cloudflare-rate-limiting nodig is voordat de registratie breed open staat.

## Volgende stappen (#44/#45)

- #64: passkey-first registratie, optionele Google-configuratie en accountlinking zijn klaar; de echte WebAuthn-ceremonie moet nog op een toestel met authenticator worden getest.
- #44: `/api/progress/*`, `player`/`progress`/`progress_mutation`/`consent` en de sync-client.
- #45: `VITE_ACCOUNTS_ENABLED`, de menu-ingang, de volledige CSP- en headeraudit, e2e-tests en de uitrol achter de flag.
