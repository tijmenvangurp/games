# Onderzoek: auth-laag (Better Auth) en een backend voor voortgang

- **Datum:** 2026-10-18
- **Status:** Onderzoek, geen beslissing
- **Vraag:** hoe kan op de bestaande stack een auth-laag (Better Auth) en een backend voor state tracking etc. toegevoegd worden?
- **Kader:** de regels uit [`AGENTS.md`](../../AGENTS.md) en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend zonder ADR, strikte CSP in [`apps/games/public/_headers`](../../apps/games/public/_headers).

## Kort advies

**Voeg nu geen backend toe. Bouw eerst lokale profielen en export/import; voeg daarna alleen een ouderaccount met sync toe als cross-device voortgang echt nodig blijkt.**

- De app is vandaag 100% statisch en dat is een feature, geen tekortkoming. Alle voortgang staat in `localStorage`; meerdere kinderen op één apparaat kunnen met lokale profielen zonder account, zonder server en zonder gegevens die de app naar buiten stuurt.
- Als er toch een backend komt: **Better Auth 1.7.10 in dezelfde Cloudflare Worker, met D1 in de EU en een ouderaccount op basis van een passkey**. Geen kindlogin, geen kind-e-mailadressen en geen profielnamen op de server. Het kind blijft lokaal spelen; sync is optioneel.
- **Geen magic link of OAuth in fase 1.** Magic link vereist e-mailverzending via een externe dienst en OAuth vereist een redirect naar een derde partij. Beide botsen met de regel "geen externe requests", ook al grijpt de browser-CSP er niet altijd op in.
- Sync in fase 1 beperkt zich tot **instellingen, beste scores en grove voortgang**. Sync geen actieve sudoku-borden, zoekrondes of SRS-toestand: dat geeft conflictgedrag zonder duidelijke winst.
- De technische minimale wijziging is: `wrangler.jsonc` krijgt een `main` en `run_worker_first: ["/api/*"]`, de CSP krijgt `connect-src 'self'`, en er komt een D1-binding. Dat is genoeg voor same-origin `/api/auth/*` en `/api/progress/*`.
- **Dit mag niet zonder ADR.** ADR 0001 zegt expliciet dat accounts, gedeelde scores en multiplayer een nieuwe ADR met privacy- en beveiligingsontwerp vereisen. Reken op minimaal twee ADR's: één voor auth/backend en één voor privacy/gegevensverwerking.
- **Gratis kan waarschijnlijk, met één voorbehoud: de CPU-limiet.** Het gratis Workers-plan geeft 100.000 requests/dag en 10 ms CPU per request. D1, Workers Builds en de request-limiet zijn voor een familie-app ruim genoeg. De 10 ms is de bottleneck: met Google OAuth of passkeys is de kans groot dat het past; met e-mail/wachtwoord (scrypt) vrijwel zeker niet. Meet de CPU op een preview en stap pas naar Workers Paid (US$ 5/maand) als het echt nodig is.
- **Multiplayer is een aparte fase met Durable Objects.** D1 is niet geschikt als realtime spelserver; D1 is single-threaded per database en heeft geen interactieve transacties.

## 1. Better Auth in het kort

### 1.1 Versie, licentie en runtime

| Onderwerp               | Stand op 2026-10-18                                                               | Bron                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Actuele stabiele versie | `better-auth` 1.7.10                                                              | [npm-registry](https://registry.npmjs.org/better-auth/latest)                                                           |
| Licentie                | MIT                                                                               | [npm-registry](https://registry.npmjs.org/better-auth/latest), [repository](https://github.com/better-auth/better-auth) |
| Taal/model              | TypeScript, framework-agnostisch, ESM                                             | [Introductie](https://better-auth.com/docs/introduction), [npm-registry](https://registry.npmjs.org/better-auth/latest) |
| Volgende versie         | 1.8 staat als beta in de documentatie                                             | [Documentatie-index](https://better-auth.com/llms.txt)                                                                  |
| Runtime-eis             | Web `Request`/`Response` en `AsyncLocalStorage`; op Workers via `nodejs_compat`   | [Installatie](https://better-auth.com/docs/installation)                                                                |
| Client                  | `better-auth/react` of `better-auth/client`; same-origin heeft geen baseURL nodig | [Client](https://better-auth.com/docs/concepts/client)                                                                  |

Better Auth is geen hosted dienst: de bibliotheek draait in je eigen runtime en de data staat in je eigen database. Er is wel een betaald infrastructuuraanbod, maar dat is voor dit project niet nodig ([introductie](https://better-auth.com/docs/introduction)). De npm-versie is 1.7.10; pin die exact in `package.json` en de lockfile. De 1.8-beta kan API's wijzigen; niet impliciet naar `latest` laten rollen.

### 1.2 Minimale server-API

Better Auth verwacht één catch-all route onder `/api/auth/*`. De handler is een gewone functie van `Request` naar `Response`; er is geen framework nodig ([installatie](https://better-auth.com/docs/installation)).

| Onderdeel               | Wat je nodig hebt                                               | Bron                                                                                                                  |
| ----------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Auth-handler            | `auth.handler(request)` voor `/api/auth/*`                      | [Installatie](https://better-auth.com/docs/installation)                                                              |
| Sessie op de server     | `auth.api.getSession({ headers })`                              | [Sessiebeheer](https://better-auth.com/docs/concepts/session-management)                                              |
| Client                  | `createAuthClient()` op dezelfde origin                         | [Client](https://better-auth.com/docs/concepts/client)                                                                |
| Verplichte configuratie | `secret`, `baseURL`, `database`, minimaal één auth-methode      | [Installatie](https://better-auth.com/docs/installation)                                                              |
| Secret                  | `BETTER_AUTH_SECRET`, minimaal 32 tekens, hoge entropie         | [Installatie](https://better-auth.com/docs/installation)                                                              |
| Secret-rotatie          | `BETTER_AUTH_SECRETS` (meervoud) voor niet-destructieve rotatie | [Installatie](https://better-auth.com/docs/installation), [Security](https://better-auth.com/docs/reference/security) |
| Base URL                | `BETTER_AUTH_URL`, de publieke origin van de app                | [Installatie](https://better-auth.com/docs/installation)                                                              |

Op Workers geef je deze waarden expliciet mee vanuit `env` in plaats van te vertrouwen op `process.env`. Dat is geen harde eis, maar het voorkomt verrassingen als de Node-compatibiliteitsmodus of de bindings veranderen. De secret hoort in een Workers-secret, niet in `vars`, niet in de repo en niet in de build-log.

### 1.3 Database, adapters en migraties

Better Auth heeft standaard vier tabellen: `user`, `session`, `account` en `verification` ([Database](https://better-auth.com/docs/concepts/database)). Het kan zonder database in stateless modus, maar de meeste plugins (waaronder passkey en anonymous) hebben opslag nodig; voor dit project is een database dus nodig.

| Route              | Ondersteuning                                                                                               | Bron                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Kysely (ingebouwd) | SQLite, PostgreSQL, MySQL, MSSQL; `migrate` en `generate`                                                   | [Database](https://better-auth.com/docs/concepts/database)                                                      |
| Drizzle            | Adapter in `@better-auth/drizzle-adapter`; schema genereren met `auth generate`, migreren met `drizzle-kit` | [Drizzle-adapter](https://better-auth.com/docs/adapters/drizzle)                                                |
| Prisma             | Adapter aanwezig; migraties via Prisma CLI                                                                  | [Database](https://better-auth.com/docs/concepts/database)                                                      |
| MongoDB            | Adapter aanwezig                                                                                            | [Database](https://better-auth.com/docs/concepts/database)                                                      |
| Cloudflare D1      | Sinds Better Auth 1.5 als first-class database; geef de D1-binding direct mee                               | [Better Auth 1.5](https://better-auth.com/blog/1-5), [Database](https://better-auth.com/docs/concepts/database) |

D1 heeft **geen interactieve transacties**. Better Auth gebruikt D1's `batch()`-API voor atomiciteit ([Better Auth 1.5](https://better-auth.com/blog/1-5)). Een batch is zelf wel een SQL-transactie: de statements worden sequentieel uitgevoerd en bij een fout wordt de hele reeks teruggedraaid ([D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)). Dat is belangrijk voor de auth-tabellen, maar ook voor onze eigen progress-upserts: bundel meerdere statements in één batch in plaats van een transactie te openen.

De CLI is `npx auth@latest generate` en `npx auth@latest migrate` ([Database](https://better-auth.com/docs/concepts/database)). `migrate` werkt alleen met de ingebouwde Kysely-adapter; bij Drizzle genereer je de schema's en laat je `drizzle-kit` migreren ([Drizzle-adapter](https://better-auth.com/docs/adapters/drizzle)). In een Workers-runtime is de CLI niet beschikbaar; gebruik `wrangler d1 migrations apply` of, alleen bij Kysely, programmatische migraties via `getMigrations` ([Database](https://better-auth.com/docs/concepts/database), [D1-migraties](https://developers.cloudflare.com/d1/reference/migrations/)).

Better Auth controleert bij initialisatie of het schema klopt. Ontbrekende tabellen of kolommen zorgen ervoor dat requests falen; de validatie stopt de server of build niet automatisch ([Database](https://better-auth.com/docs/concepts/database)). Draai de migraties dus vóór de deploy, niet "lui" bij de eerste request.

### 1.4 Sessies, cookies, CSRF en rate limiting

| Onderwerp          | Standaard                                                        | Wat het betekent voor deze app                                                                                                     | Bron                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Sessieduur         | 7 dagen; `updateAge` 1 dag                                       | 7 dagen is de default; voor een kindertablet kan dat kort zijn, maar een langere sessie verhoogt het risico op een gedeeld toestel | [Security](https://better-auth.com/docs/reference/security), [Sessiebeheer](https://better-auth.com/docs/concepts/session-management) |
| Verse sessie       | `freshAge` 1 dag                                                 | Nodig voor gevoelige acties zoals account verwijderen                                                                              | [Sessiebeheer](https://better-auth.com/docs/concepts/session-management)                                                              |
| Cookie             | `HttpOnly`, `Secure` bij https, `SameSite=Lax`                   | Same-origin auth voorkomt third-party cookieproblemen (Safari ITP)                                                                 | [Security](https://better-auth.com/docs/reference/security), [Cookies](https://better-auth.com/docs/concepts/cookies)                 |
| Cookie-cache       | Standaard uit; optioneel `session.cookieCache`                   | Minder database-reads, maar ingetrokken sessies blijven tot `maxAge` geldig                                                        | [Sessiebeheer](https://better-auth.com/docs/concepts/session-management)                                                              |
| CSRF               | Origin-validatie, Fetch Metadata, geen mutaties op GET           | Werkt ook met `Referrer-Policy: no-referrer`: Better Auth valt terug op `Sec-Fetch-Site` als `Origin: null` binnenkomt             | [Security](https://better-auth.com/docs/reference/security)                                                                           |
| Trusted origins    | Standaard alleen de base URL                                     | Zet de publieke origin expliciet; geen `localhost` in productie                                                                    | [Security](https://better-auth.com/docs/reference/security)                                                                           |
| Rate limiting      | 100 requests per 10 seconden; `/sign-in/email` 3 per 10 seconden | In-memory opslag is ongeschikt voor serverless; gebruik D1 of secundaire opslag                                                    | [Rate limit](https://better-auth.com/docs/concepts/rate-limit)                                                                        |
| IP-detectie        | Standaard `X-Forwarded-For`                                      | Op Cloudflare `cf-connecting-ip` gebruiken; die header kan de client niet zelf zetten                                              | [Rate limit](https://better-auth.com/docs/concepts/rate-limit)                                                                        |
| Wachtwoord-hashing | `scrypt`, memory-hard en CPU-intensief                           | Vermijd dit op het gratis plan; het is de zwaarste CPU-variant                                                                     | [Security](https://better-auth.com/docs/reference/security)                                                                           |

De CSRF-details zijn relevant omdat de huidige `_headers` `Referrer-Policy: no-referrer` zet. Better Auth documenteert expliciet dat een same-origin formulier dan `Origin: null` kan sturen en dat het met `Sec-Fetch-Site` alsnog valideert; requests zonder die bewijzen en zonder Origin/Referer blijven alleen voor niet-browserclients toegestaan ([Security](https://better-auth.com/docs/reference/security)). Dat is geen reden om de CSRF-checks uit te zetten; `disableCSRFCheck` en `disableOriginCheck` openen respectievelijk CSRF- en open-redirect-risico's ([Security](https://better-auth.com/docs/reference/security)).

Rate limiting in het geheugen is per isolate en dus niet betrouwbaar over meerdere Workers-isolaten. Better Auth ondersteunt `storage: "database"` met een `rateLimit`-tabel, of een secundaire opslag ([Rate limit](https://better-auth.com/docs/concepts/rate-limit)). Voor deze app is D1 het eenvoudigst; elke loginpoging kost dan een paar writes. Bij een laag volume is dat verwaarloosbaar, maar het is wel een reden om de standaardlimieten niet lager te zetten dan nodig.

### 1.5 Wat je expliciet moet configureren

| Optie                                 | Advies                                                                                                 | Bron                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `secret`                              | Uit `env.BETTER_AUTH_SECRET`; 32+ tekens; rotatie via `BETTER_AUTH_SECRETS`                            | [Installatie](https://better-auth.com/docs/installation)                       |
| `baseURL`                             | De publieke origin; geen wildcard, geen preview-URL                                                    | [Installatie](https://better-auth.com/docs/installation)                       |
| `database`                            | `env.DB` (D1) of `drizzle(env.DB)`                                                                     | [Better Auth 1.5](https://better-auth.com/blog/1-5)                            |
| `trustedOrigins`                      | Alleen de productie-origin; previews apart of auth uit                                                 | [Security](https://better-auth.com/docs/reference/security)                    |
| `advanced.ipAddress.ipAddressHeaders` | `["cf-connecting-ip"]`                                                                                 | [Rate limit](https://better-auth.com/docs/concepts/rate-limit)                 |
| `rateLimit.storage`                   | `"database"` bij D1                                                                                    | [Rate limit](https://better-auth.com/docs/concepts/rate-limit)                 |
| `session.cookieCache`                 | Voorlopig uit; later eventueel korte `maxAge`                                                          | [Sessiebeheer](https://better-auth.com/docs/concepts/session-management)       |
| `telemetry`                           | Expliciet `{ enabled: false }`                                                                         | [Telemetrie](https://better-auth.com/docs/reference/telemetry)                 |
| `user.deleteUser.enabled`             | `true`, met verificatie                                                                                | [Gebruikers en accounts](https://better-auth.com/docs/concepts/users-accounts) |
| `advanced.cookiePrefix`               | Bijvoorbeeld `spellen`; houd de standaard niet als je merkt dat meerdere apps op dezelfde origin staan | [Cookies](https://better-auth.com/docs/concepts/cookies)                       |

Telemetrie staat **standaard uit** en is alleen voor anonieme gebruiksstatistieken; als je hem aanzet, gaat er bij initialisatie een request naar buiten ([Telemetrie](https://better-auth.com/docs/reference/telemetry)). Dat is onverenigbaar met "geen externe requests". Zet hem dus expliciet uit, ook al is de default al uit.

## 2. Better Auth op Cloudflare Workers

### 2.1 Workers + D1

De officiële installatiehandleiding heeft een Cloudflare Workers-tab: je roept `auth.handler(request)` aan vanuit de Worker en zet `nodejs_compat` aan voor `AsyncLocalStorage` ([Installatie](https://better-auth.com/docs/installation)). Sinds Better Auth 1.5 kun je de D1-binding direct doorgeven; de ingebouwde D1-dialect regelt query-uitvoering, batches en introspectie ([Better Auth 1.5](https://better-auth.com/blog/1-5)).

```text
Worker-route:  /api/auth/*  ->  auth.handler(request)
Progress-API: /api/progress/* -> sessie + D1
Overig:       /assets/*, /audio/*, SPA-shell -> statische assets
```

Dit is pseudocode, geen implementatie. De belangrijke eigenschap is dat auth en progress **dezelfde origin** delen. Daardoor zijn er geen CORS-headers, geen third-party cookies en geen extra CSP-origins nodig.

Drizzle kan ook op D1: `drizzle(env.DB)` met de D1-driver en `drizzle-kit` voor migraties ([Drizzle + D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)). De keuze is vooral smaak en migratiegereedschap:

| Keuze                              | Voordeel                                                                    | Nadeel                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Better Auth's ingebouwde D1/Kysely | Minste dependencies; `database: env.DB`; programmatische migraties mogelijk | Minder typed query's voor eigen tabellen                                                                 |
| Drizzle op D1                      | Eén schema voor auth en progress; typed queries; `drizzle-kit`              | Extra dependency en aparte migratiestap; Better Auth's programmatische migraties werken niet met Drizzle |

Voor een kleine app met twee eigen tabellen is de ingebouwde D1-route het eenvoudigst. Zodra je veel eigen queries krijgt, is Drizzle de betere keuze.

### 2.2 Hyperdrive/Postgres als alternatief

Hyperdrive geeft Workers een versnelde verbinding naar een bestaande Postgres- of MySQL-database, inclusief connection pooling en query-caching ([Hyperdrive](https://developers.cloudflare.com/hyperdrive/)). Better Auth ondersteunt Postgres via `pg.Pool` of Kysely ([PostgreSQL-adapter](https://better-auth.com/docs/adapters/postgresql)). Dat is interessant als je al een beheerde Postgres hebt of meer relationele controle wilt.

| Aspect       | D1                                       | Hyperdrive + Postgres                             |
| ------------ | ---------------------------------------- | ------------------------------------------------- |
| Beheer       | Volledig beheerd, geen server            | Je beheert de Postgres zelf (of bij een provider) |
| Transacties  | Geen interactieve transacties; `batch()` | Volledige transacties                             |
| Grootte      | 10 GB per database (paid), 500 MB (free) | Afhankelijk van de provider                       |
| Locatie      | `eu`-jurisdictie of locatiehint          | Afhankelijk van de provider/regio                 |
| Complexiteit | Laag                                     | Hoger: netwerk, credentials, pooling, backups     |
| Kosten       | D1-pricing                               | Postgres + Hyperdrive                             |

Voor deze app is D1 de betere eerste keuze. Hyperdrive is pas logisch als je al een Postgres hebt of als je meer dan 10 GB of zware relationele queries nodig hebt.

### 2.3 Wat werkt niet, of alleen met mitsen

| Onderwerp                | Status op Workers                                                                              | Bron                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-sqlite3`         | Niet bruikbaar; dat is een native Node-module                                                  | [Node.js-compatibiliteit](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)                                                         |
| `node:fs`                | Workers heeft geen persistent bestandssysteem; gebruik D1/R2/KV                                | [Node.js-compatibiliteit](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)                                                         |
| Prisma                   | Niet de gedocumenteerde Workers-route in Better Auth; kies D1 of Drizzle/Kysely en test vooraf | [Database](https://better-auth.com/docs/concepts/database)                                                                                        |
| CLI in de runtime        | Niet beschikbaar; migreer via `wrangler d1` of CI                                              | [Database](https://better-auth.com/docs/concepts/database)                                                                                        |
| Interactieve transacties | D1 ondersteunt ze niet; gebruik `batch()`                                                      | [Better Auth 1.5](https://better-auth.com/blog/1-5)                                                                                               |
| `argon2`                 | Niet ondersteund in `node:crypto` op Workers                                                   | [Node crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/)                                                              |
| `scrypt`                 | Wel ondersteund, maar CPU-intensief                                                            | [Node crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [Security](https://better-auth.com/docs/reference/security) |

De Node-compatibiliteitslaag is op deze repo al standaard: sinds compatibiliteitsdatum `2026-08-04` zet Workers `nodejs_compat` en `nodejs_compat_v2` automatisch aan ([Compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)). De repo staat op `2026-10-17`, dus een expliciete `nodejs_compat`-flag is niet nodig. Laat de datum staan of verhoog hem bewust; verlaag hem niet zonder de Node-API's opnieuw te controleren.

### 2.4 Limieten die de architectuur bepalen

| Limiet                  | Workers Free             | Workers Paid         | Relevantie                                               |
| ----------------------- | ------------------------ | -------------------- | -------------------------------------------------------- |
| CPU per request         | 10 ms                    | 5 min (default 30 s) | Auth met scrypt past waarschijnlijk niet in 10 ms; meten |
| Memory per isolate      | 128 MB                   | 128 MB               | Ruim genoeg voor auth; niet voor grote in-memory data    |
| Subrequests per request | 50                       | 10.000               | D1-queries en e-mail tellen mee                          |
| Request body            | 100 MB (Cloudflare-plan) | 100 MB               | Onze JSON is klein; geen issue                           |
| Statische bestanden     | 20.000                   | 100.000              | Honderden audiofragmenten passen                         |
| Bestandsgrootte         | 25 MiB                   | 25 MiB               | Idem                                                     |

Bron: [Workers-limieten](https://developers.cloudflare.com/workers/platform/limits/). De CPU-limiet is de belangrijkste: de pagina zegt zelf dat zware workloads met authenticatie vaak 10–20 ms CPU gebruiken. Het gratis plan heeft 10 ms. Better Auth's scrypt is memory-hard en CPU-intensief ([Security](https://better-auth.com/docs/reference/security)); gebruik je alleen Google OAuth of passkeys, dan valt de scrypt-kost weg, maar blijven auth, D1 en WebAuthn over. Meet beide varianten met een echte login op de preview. Gratis is haalbaar als de meting onder 10 ms blijft; stap pas naar Workers Paid (US$ 5/maand) als de p95 structureel hoger is ([Workers-pricing](https://developers.cloudflare.com/workers/platform/pricing/)).

| D1-limiet                  | Free    | Paid     | Relevantie                                |
| -------------------------- | ------- | -------- | ----------------------------------------- |
| Databasegrootte            | 500 MB  | 10 GB    | Onze data is klein                        |
| Databases per account      | 10      | 50.000   | Eén database is genoeg                    |
| Queries per invocation     | 50      | 1.000    | Auth + progress ruim binnen               |
| Rijgrootte                 | 2 MB    | 2 MB     | JSON-state per spel blijft ver onder 2 MB |
| Kolommen per tabel         | 100     | 100      | Auth-schema past                          |
| Queryduur                  | 30 s    | 30 s     | Ruim                                      |
| Time Travel                | 7 dagen | 30 dagen | Bewaarperiode en verwijderrecht           |
| Gelijktijdige verbindingen | 6       | 6        | Per invocation                            |

Bron: [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/).

D1 is per database single-threaded en verwerkt queries één voor één. Bij veel gelijktijdige requests kan een database "overloaded" teruggeven; batch queries en houd ze kort ([D1-limieten](https://developers.cloudflare.com/d1/platform/limits/)). Voor een familie-app is dat geen probleem; voor multiplayer is het een reden om Durable Objects te gebruiken.

### 2.5 Read replication: mooi, maar niet automatisch

D1 read replication maakt read-only kopieën in meerdere regio's. Je moet daarvoor de **Sessions API** gebruiken; zonder Sessions API blijven alle queries naar de primary gaan ([D1 read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/)). Better Auth's D1-adapter gebruikt de D1-binding en `batch()`, niet automatisch de Sessions API. Zet read replication dus niet aan in de verwachting dat auth sneller wordt; test eerst of de adapter Sessions API gebruikt. Zonder Sessions API is er ook geen replicatie-lag, omdat alles bij de primary blijft.

### 2.6 Secrets en configuratie op Workers

| Waarde                             | Soort    | Waar                                                  | Bron                                                                                                    |
| ---------------------------------- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`               | Secret   | Workers-secret via `wrangler secret put` of dashboard | [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)                             |
| `BETTER_AUTH_URL`                  | Variable | `vars` of dashboard; geen geheim                      | [Environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) |
| D1-binding `DB`                    | Binding  | `wrangler.jsonc` met `database_id`                    | [D1-migraties](https://developers.cloudflare.com/d1/reference/migrations/)                              |
| E-mail-API-key (alleen magic link) | Secret   | Workers-secret; nooit in de repo                      | [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)                             |

Lokaal gebruik je `.dev.vars` of `.env`; die bestanden horen in `.gitignore` en nooit in een commit ([Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)). Workers Builds bouwt en deployt bij een push naar `main` ([Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)); de build heeft geen toegang tot runtime-secrets tenzij je ze apart als buildvariabele zet. Zet dus geen secrets in de buildcommand.

Workers Builds voert **geen** `wrangler d1 migrations apply` uit. Dat is een aparte stap vóór of na de deploy ([D1-migraties](https://developers.cloudflare.com/d1/reference/migrations/)). Better Auth's schema-validatie laat requests falen als de tabellen ontbreken ([Database](https://better-auth.com/docs/concepts/database)), dus een deploy zonder migratie is geen "leeg maar werkend" systeem.

Dat is een concreet operationeel gat: de deploy is nu `npx wrangler deploy` via Workers Builds, en die stap kent geen D1-migratie. `wrangler d1 migrations apply` heeft een geauthenticeerde Wrangler-context nodig. Test in een preview of Workers Builds die stap kan uitvoeren; zo niet, voer de migratie handmatig uit vóór de deploy of zet een aparte migratiestap op met een scoped token. Laat de Worker niet bij de eerste request migreren: dat geeft race conditions en verbergt fouten tot ze in productie optreden.

De D1 `database_id` is geen geheim — zonder accounttoken kun je er niets mee — maar het is wel infrastructuurmetadata. De repo is publiek; beslis in de ADR of je de ID commit of via de Cloudflare-dashboardconfig laat lopen. Wat je **niet** doet: een account-ID, API-token of e-mailprovider-key in `wrangler.jsonc` zetten.

### 2.7 Wat ik niet heb geverifieerd

| Onzekerheid                                                                | Waarom het uitmaakt                                       | Wat je moet doen                                      |
| -------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| CPU-kosten van scrypt/passkey op Workers Free                              | 10 ms is de nominale grens; auth kan er net overheen gaan | Meten met een preview-login; zo nodig Workers Paid    |
| Of Better Auth's D1-adapter de D1 Sessions API gebruikt                    | Bepaalt of read replication iets oplevert                 | Adapterbron/versie controleren; anders replicatie uit |
| Prisma op Workers                                                          | Niet de gedocumenteerde route; kan verrassingen geven     | Niet kiezen zonder spike                              |
| Prijzen en limieten van Cloudflare                                         | Kunnen wijzigen                                           | Vóór de beslissing de actuele pagina's checken        |
| Prijzen en bewaartermijnen van e-mailproviders                             | Bepalen de operationele last en privacy                   | Apart onderzoek; niet in dit document                 |
| Versiecompatibiliteit van `@better-auth/passkey` met 1.7.10                | Aparte package, kan eigen releasecyclus hebben            | Versies in de lockfile op elkaar afstemmen            |
| Path-specifieke CSP in `_headers`                                          | Meerdere CSP-headers worden gecombineerd                  | Testen in een preview; liever één globale regel       |
| Juridische kwalificatie (verwerkingsverantwoordelijke, COPPA, toestemming) | Dit is geen juridisch advies                              | Laat dit toetsen door een jurist of de AP             |
| Of `database_id` in de publieke repo acceptabel is                         | Het is geen secret, maar wel metadata                     | Beleid kiezen en in de ADR vastleggen                 |

## 3. Auth-methoden voor kinderen en ouders

De doelgroep is 6–12 jaar. Dat verandert de vraag: niet "welke login is handig?", maar "welke login voorkomt dat een kind een account en een identiteit nodig heeft?".

| Methode                                     | Geschikt voor kind | Privacy                        | Operationele last | Kosten                 | Breekt "geen externe requests"?                         | E-mail nodig                                                       |
| ------------------------------------------- | ------------------ | ------------------------------ | ----------------- | ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Ouderaccount + passkey, kind speelt lokaal  | Ja, indirect       | Zeer laag: geen kind-PII       | Laag              | €0 (of providerkosten) | Nee                                                     | Technisch veld ja; gebruik `@invalid` of ouder-e-mail voor herstel |
| Ouderaccount + e-mail/wachtwoord            | Ja, indirect       | Laag, maar ouder-e-mail is PII | Laag              | €0 (of providerkosten) | Nee, als je verificatie/e-mailherstel uitzet; anders ja | Ja                                                                 |
| Magic link voor ouder                       | Ja, indirect       | Ouder-e-mail bij provider      | Midden            | Providerafhankelijk    | **Ja**                                                  | Ja                                                                 |
| OAuth/social (Google, Apple)                | Nee                | Derde partij, leeftijdsgrenzen | Midden            | €0                     | **Ja**                                                  | Nee                                                                |
| Anonymous/guest                             | Beperkt            | Geen PII, maar wel serverrijen | Midden (opruimen) | €0                     | Nee                                                     | Nee                                                                |
| Device authorization                        | Ja, voor tablet/TV | Laag                           | Midden            | €0                     | Nee, tenzij ouder per e-mail inlogt                     | Nee                                                                |
| Organization/family-plugin                  | Nee, te zwaar      | Laag                           | Hoog              | €0                     | Nee                                                     | Ja (user heeft e-mail)                                             |
| Geen auth: lokale profielen + export/import | Ja                 | Geen serverdata                | Zeer laag         | €0                     | Nee                                                     | Nee                                                                |

### 3.1 Ouderaccount met passkey (aanbevolen als er een backend komt)

- **Hoe:** de ouder maakt één account op een eigen telefoon of tablet, met een passkey (WebAuthn/FIDO2). Het kind speelt daarna op een lokaal profielslot. Sync kan via een beperkte koppeling; geef het kindertoestel geen volledige ouder-sessie.
- **Waarom:** geen wachtwoord om te vergeten, geen e-mail bij elke login, phishing-resistent, en geen kindidentiteit op de server. Passkeys zijn cryptografische sleutelparen; de private key blijft op het toestel ([Passkey-plugin](https://better-auth.com/docs/plugins/passkey)).
- **Nadelen:** herstel is lastiger. Als de ouder zijn toestel kwijt is, zijn er recovery-codes of een tweede passkey nodig. Synced passkeys (iCloud/Google) kunnen via de platformaccount gaan; de site doet zelf geen extern request, maar de authenticator kan dat wel doen. Dat is een leverancierskeuze die je in de privacyverklaring noemt.
- **Geschikt voor gedeelde tablets?** Niet zonder beperking: een volledige ouder-sessie op een kindertoestel geeft het kind toegang tot accountinstellingen en verwijdering. Gebruik een aparte, beperkte sync-sessie (eigen endpoint of rol) of laat sync alleen op het ouderapparaat lopen. Een lokaal profiel per kind voorkomt bovendien dat broers/zussen elkaars voortgang zien.
- **Implementatie:** `passkey()` serverplugin en `passkeyClient()`; aparte package `@better-auth/passkey` ([Passkey-plugin](https://better-auth.com/docs/plugins/passkey)). WebAuthn vereist HTTPS en een correcte RP-ID; op de publieke origin is dat prima.
- **E-mailveld:** Better Auth's core `user`-tabel heeft een verplicht, uniek `email`-veld ([Database](https://better-auth.com/docs/concepts/database)). Een passkey-only account heeft dus technisch een e-mailwaarde nodig. Gebruik een synthetische `@invalid`-waarde als je geen ouder-e-mail wilt, of vraag een e-mail voor herstel en verificatie; vul die waarde bij de user-creatie of via een database-hook in. Kies dit bewust: een synthetische e-mail betekent ook geen e-mailherstel.
- **Passkey-first:** registratie zonder bestaande sessie kan met `registration.requireSession: false`; de user wordt dan in `resolveUser`/`afterVerification` aangemaakt. Dat past bij een ouderaccount dat meteen met een passkey begint. Vul daar wel een geldige `email`-waarde in, anders faalt de core-user ([Passkey-plugin](https://better-auth.com/docs/plugins/passkey)).
- **Domeingebonden:** passkeys zijn gekoppeld aan de RP-ID, dus aan het domein. Verhuis je later van de `workers.dev`-origin naar een eigen domein, dan moeten passkeys opnieuw worden geregistreerd. Kies de definitieve origin vóór je passkeys uitrolt.
- **Open registratie:** elke loginmethode op een publieke URL trekt bots en misbruik aan. Overweeg een gesloten registratie (uitnodigingscode of alleen accounts die de eigenaar aanmaakt) en houd de rate limits aan. Dat is ook goedkoper.

### 3.2 Ouderaccount met e-mail en wachtwoord

- **Hoe:** standaard `emailAndPassword.enabled: true`, met e-mailverificatie en wachtwoordreset ([E-mail en wachtwoord](https://better-auth.com/docs/authentication/email-password), [E-mail](https://better-auth.com/docs/concepts/email)).
- **Waarom:** bekend, geen passkey-afhankelijkheid, werkt op elk toestel.
- **Nadelen:** wachtwoordvergeten, reset-mail via een externe provider, en de verleiding om het kind een wachtwoord te laten kiezen. Gebruik dit alleen voor de ouder, nooit voor het kind.
- **Lokale ontwikkeling:** Better Auth verstuurt zonder `sendResetPassword`/`sendVerificationEmail` geen e-mail; je kunt de URL in je eigen callback tijdelijk loggen. In productie moet je een provider kiezen; dat is een externe dienst en dus een beleidsbeslissing.
- **Accountverwijdering:** Better Auth kan een gebruiker hard verwijderen; zet `user.deleteUser.enabled` aan en vraag een verse sessie of e-mailverificatie ([Gebruikers en accounts](https://better-auth.com/docs/concepts/users-accounts)).

### 3.3 Magic link

- **Hoe:** de ouder vult een e-mailadres in; Better Auth genereert een token en roept `sendMagicLink` aan. De link is standaard 300 seconden geldig; het endpoint heeft een rate limit van 5 per 60 seconden ([Magic link](https://better-auth.com/docs/plugins/magic-link)).
- **Waarom:** geen wachtwoord, ouder-vriendelijk.
- **Nadelen:** elke login vereist toegang tot de inbox; e-maildeliverability; de e-mailprovider ziet het adres en de metadata. Dit is een **externe request** vanuit de Worker, ook al staat `connect-src 'none'` in de browser-CSP. De CSP regelt alleen de browser, niet server-side `fetch`.
- **Conclusie:** alleen overwegen als de eigenaar expliciet een e-mailprovider als verwerker accepteert en de "geen externe requests"-regel voor server-side e-mail wil versoepelen. Dat vraagt een ADR en een DPA.

### 3.4 OAuth/social

- **Hoe:** `socialProviders` met client-ID en secret; redirect naar de provider en terug ([OAuth](https://better-auth.com/docs/concepts/oauth)).
- **Waarom niet:** de browser verlaat de site, de provider ziet het bezoek, sommige providers hebben leeftijdsgrenzen, en je krijgt een derde partij in de keten. De CSP blokkeert top-level navigatie niet per se, maar het is wel een externe request en een privacyrelatie die je moet uitleggen.
- **Voor kinderen:** ongeschikt. Een Google- of Apple-account is geen kindvriendelijke identiteit en de ouder moet hem beheren.
- **Conclusie:** niet doen in fase 1. Als de ouder later per se "Inloggen met Google" wil, is dat een aparte ADR met een goede reden.

### 3.5 Anonymous/guest

- **Hoe:** `anonymous()` plugin; `signIn.anonymous()` maakt een user met een gegenereerd e-mailadres en een sessie. Later kan de ouder een echte methode koppelen; de anonymous user wordt standaard verwijderd ([Anonymous-plugin](https://better-auth.com/docs/plugins/anonymous)).
- **Waarom:** een kind kan meteen spelen zonder PII.
- **Nadelen:** je krijgt toch serverrijen en cookies; je moet anonymous users opruimen; en een anonymous account is geen ouderlijke toestemming. Voor een publieke kinderapp is "guest" vooral een technische tussenstand, geen eindmodel.
- **Conclusie:** niet nodig als je lokale profielen al hebt. Als je het gebruikt, alleen als tijdelijke brug en met een opruimtaak.

### 3.6 Device authorization

- **Hoe:** RFC 8628-flow: het toestel vraagt een code aan, de ouder bezoekt een verificatie-URL en keurt goed, het toestel pollt op een token ([Device authorization](https://better-auth.com/docs/plugins/device-authorization)).
- **Waarom:** handig voor een TV, console of toestel zonder fatsoenlijk toetsenbord.
- **Nadelen:** extra plugin, extra tabel, extra UI, en de ouder moet alsnog inloggen. Een tablet met browser kan gewoon de normale login gebruiken.
- **Conclusie:** alleen voor een specifiek toesteltype; niet in fase 1.

### 3.7 Organization/family-plugin

- **Hoe:** `organization()` met leden, rollen en uitnodigingen ([Organization-plugin](https://better-auth.com/docs/plugins/organization)).
- **Waarom niet:** het is gebouwd voor organisaties en teams, niet voor een gezin. De semantiek (organisatie, owner, admin, invitation) is zwaar en voegt tabellen en rechten toe die je niet nodig hebt. Een eigen `player`-tabel met een ouder-user is eenvoudiger en privacyvriendelijker.
- **Conclusie:** niet gebruiken.

### 3.8 Geen auth: lokale profielen en export/import

- **Hoe:** meerdere profielslots op één apparaat, elk met een eigen namespace in `localStorage`; daarnaast een JSON-export/import-bestand met een versienummer.
- **Waarom:** geen server, geen account, geen verzonden persoonsgegevens, geen CSP-wijziging, geen kosten. Het lost de meest voorkomende behoefte (broers/zussen op één tablet) op.
- **Nadelen:** geen cross-device sync, geen ouder-dashboard op afstand, geen multiplayer. Maar dat zijn precies de functies die een backend en een privacyontwerp rechtvaardigen.
- **Conclusie:** dit is de juiste fase 0.5. Bouw dit eerst; het is alsof je een backend hebt, maar zonder de verplichtingen.

### 3.9 E-mailverificatie, wachtwoordreset en accountverwijdering

| Functie             | Nodig bij                     | Wat Better Auth biedt                                                              | Bron                                                                           |
| ------------------- | ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| E-mailverificatie   | E-mail/wachtwoord, magic link | `sendVerificationEmail`, `requireEmailVerification`, `autoSignInAfterVerification` | [E-mail](https://better-auth.com/docs/concepts/email)                          |
| Wachtwoordreset     | E-mail/wachtwoord             | `sendResetPassword` met tokenlink                                                  | [E-mail](https://better-auth.com/docs/concepts/email)                          |
| Accountverwijdering | Alle methoden                 | `deleteUser` met wachtwoord, verse sessie of e-mailverificatie                     | [Gebruikers en accounts](https://better-auth.com/docs/concepts/users-accounts) |
| Anoniem opruimen    | Anonymous                     | `deleteAnonymousUser`, automatisch bij linken                                      | [Anonymous-plugin](https://better-auth.com/docs/plugins/anonymous)             |
| Sessies intrekken   | Alle methoden                 | `revokeSession`, `revokeOtherSessions`, `revokeSessions`                           | [Sessiebeheer](https://better-auth.com/docs/concepts/session-management)       |

Als je geen e-mail gebruikt, moet je een ander herstelpad hebben: recovery-codes, een tweede passkey, of accepteren dat een kwijtgeraakt account niet hersteld kan worden. Dat is een productbeslissing, geen technische. Voor een kinderapp is "ouder kan altijd bij de lokale data" vaak belangrijker dan "ouder kan vanaf elk apparaat inloggen".

## 4. Backend voor state tracking

### 4.1 Wat er nu lokaal staat

De app bewaart per spel een JSON-object onder een versiekey. De vorm verschilt per spel:

| Spel         | Key                     | Wat erin zit                                                                                                            | Syncen?                                             |
| ------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Sudoku       | `games.sudoku.v1`       | `play` (puzzel, `entries`, `hinted`, `selected`, `solved`) en `settings` (`size`, `difficulty`, `theme`, `mistakeMode`) | Instellingen ja; actief bord nee (apparaatgebonden) |
| Memory       | `games.memory.v1`       | `settings.difficulty`                                                                                                   | Ja                                                  |
| Rekenen      | `games.math.v1`         | `settings` (`mode`, `level`) en `best` (sterren per `mode:level`, 0–10)                                                 | Ja; `best` als maximum                              |
| Pokémon-quiz | `games.pokemon-quiz.v1` | `settings.difficulty`                                                                                                   | Ja                                                  |
| Woordzoeker  | `games.word-search.v1`  | `settings`, `puzzle`, `found`                                                                                           | Instellingen ja; lopende puzzel optioneel           |
| Pijlen       | `games.arrows.v2`       | `unlocked` (aantal vrijgespeelde levels) en `current` (getoond level)                                                   | `unlocked` ja; `current` nee                        |
| Zoeken       | `games.seek.v1`         | `settings` (`difficulty`, `theme`)                                                                                      | Ja                                                  |
| Geluid       | `games.sound.v1`        | `"on"` of `"off"`                                                                                                       | Nee, tenzij je het als accountinstelling wilt       |

Bronnen: [`sudoku`](../../libs/features/sudoku-game/model/storage.ts), [`memory`](../../libs/features/memory-game/model/storage.ts), [`math`](../../libs/features/math-trainer/model/storage.ts), [`pokemon-quiz`](../../libs/features/pokemon-quiz/model/storage.ts), [`word-search`](../../libs/features/word-search/model/storage.ts), [`arrows`](../../libs/features/arrow-game/model/storage.ts), [`seek`](../../libs/features/seek-and-find/model/storage.ts), [`sound`](../../libs/shared/lib/sound.ts).

De stores laden deze state bij module-initialisatie ([`use-sudoku-store.ts`](../../libs/features/sudoku-game/model/use-sudoku-store.ts)). Dat is snel en werkt offline, maar betekent wel dat een serverrespons die later binnenkomt niet automatisch de store bijwerkt. Elke store heeft een expliciete `hydrateFromSync`-achtige actie nodig, of een dunne sync-laag die de bestaande `save`/`load`-functies vervangt. Doe dat niet door bij elke render `localStorage` te lezen.

### 4.2 Wat zinvol is om te syncen

| Categorie            | Voorbeelden                               | Syncen in fase 1? | Reden                                                 |
| -------------------- | ----------------------------------------- | ----------------- | ----------------------------------------------------- |
| Voorkeuren           | moeilijkheid, thema, modus                | Ja                | Klein, conflictarm, echte meerwaarde op nieuw toestel |
| Beste scores         | rekensterren, pijlen-unlocked             | Ja                | Klein; `max`-merge voorkomt regressie                 |
| Grove voortgang      | aantal opgeloste puzzels, levelvoortgang  | Ja, later         | Nuttig voor ouder-dashboard                           |
| Actieve sessie       | sudoku-bord, woordzoeker-grid, `selected` | Nee               | Groot, apparaatgebonden, conflictgevoelig             |
| SRS/franse voortgang | box, `dueAt` per item                     | Niet in fase 1    | Per-item merge nodig; nog niet opgeslagen             |
| Geluid               | `on`/`off`                                | Nee               | Toestelvoorkeur, geen accountwaarde                   |

De regel: **sync alleen data die op een ander toestel dezelfde betekenis heeft**. Een sudoku die halverwege is, wil je niet per se op een tablet en een telefoon tegelijk openen; een sterrenscore wel.

### 4.3 Vier modellen vergeleken

| Model                                                 | Hoe het werkt                                                                                 | Voordelen                                                              | Nadelen                                                   | Geschikt voor                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| (a) Generieke `progress`-tabel met JSON per user+game | Eén rij per speler per spel; `data_json` bevat de volledige state; `revision` en `updated_at` | Eenvoudig, weinig tabellen, schema-agnostisch, makkelijk te exporteren | Geen per-veld-merge; grote JSON; moeilijk te queryen      | Fase 1 en 2                            |
| (b) Event-log/append-only                             | Elke mutatie is een rij; huidige state is een projectie                                       | Replay, audit, fijne merge, ongeldige events negeren                   | Veel rijen, meer writes, PII in payloads, schema-evolutie | Later, alleen voor achievements of SRS |
| (c) D1 + Durable Objects                              | D1 voor profielen; DO per room/sessie voor realtime state                                     | Sterk voor multiplayer, WebSockets, autoritatieve roomstate            | Complex, duurder, hibernation/alarms, aparte deployment   | Fase 3                                 |
| (d) KV/R2 voor grote data                             | KV voor korte/read-heavy data; R2 voor blobs en exports                                       | Goedkoop, groot, scale-out                                             | KV is eventual-consistent (tot 60 s); R2 is geen database | Export/backups, geen voortgang         |

Bronnen: [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/), [KV-werking](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [R2-pricing](https://developers.cloudflare.com/r2/pricing/), [Durable Objects-pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

KV is expliciet **eventual-consistent**: wijzigingen kunnen tot 60 seconden of langer onzichtbaar zijn op andere locaties ([KV-werking](https://developers.cloudflare.com/kv/concepts/how-kv-works/)). Daarom is KV ongeschikt voor "mijn voortgang is nu opgeslagen". Gebruik KV hooguit voor een sessie-cache; rate limiting en voortgang horen in D1, dat voorspelbaarder is.

### 4.4 Voorgesteld schema

| Tabel               | Velden                                                                                                                                                | Doel                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `user`              | Better Auth-standaard                                                                                                                                 | Ouderaccount; geen kinddata                        |
| `session`           | Better Auth-standaard, inclusief `ipAddress`/`userAgent`                                                                                              | Sessies; minimaliseer en ruim op                   |
| `account`           | Better Auth-standaard                                                                                                                                 | Passkey of credential                              |
| `verification`      | Better Auth-standaard                                                                                                                                 | Tokens voor herstel/verificatie                    |
| `player`            | `id`, `owner_user_id`, `slot` (1–4), `avatar`, `created_at`, `deleted_at`                                                                             | Kindprofiel zonder naam of e-mail                  |
| `progress`          | `player_id`, `game_id`, `schema_version`, `revision`, `data_json`, `client_updated_at`, `server_updated_at`, `deleted_at`; PK(`player_id`, `game_id`) | Eén JSON-document per speler per spel              |
| `progress_mutation` | `idempotency_key` (PK), `player_id`, `game_id`, `applied_revision`, `created_at`                                                                      | Idempotente retries en outbox                      |
| `consent`           | `owner_user_id`, `policy_version`, `granted_at`, `withdrawn_at`, `method`                                                                             | Bewijs van ouderlijke toestemming, zonder kinddata |
| `rateLimit`         | Better Auth-tabel, als `rateLimit.storage = "database"`                                                                                               | Rate limiting over meerdere isolates               |

`player.slot` is bewust geen naam. Een naam is optioneel en blijft lokaal; de server kent alleen "profiel 1" met een avatar. Dat is genoeg voor sync en een ouder-dashboard, en het scheelt een categorie persoonsgegevens. Als de ouder toch een naam wil, kun je die lokaal opslaan en alleen de slot-id syncen.

`progress.data_json` is een envelop, geen vrijbrief. Elke game heeft een `schemaVersion` en een pure migratie-/mergefunctie in de entity-laag. De server begrijpt de envelop, maar niet de inhoud; daardoor kan een spel later zijn eigen formaat wijzigen zonder auth-tabellen aan te raken.

### 4.5 Idempotente sync, offline-first en conflicten

| Stap              | Gedrag                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| 1. Lokale mutatie | Store schrijft eerst naar `localStorage`; de app blijft werken zonder netwerk                       |
| 2. Outbox         | Eén samengevoegde snapshot per speler+spel, met `idempotencyKey`, `baseRevision`, `clientUpdatedAt` |
| 3. Flush          | Debounce (bijvoorbeeld 1–2 s) en single-flight; bij offline opnieuw proberen met backoff            |
| 4. Server         | `INSERT ... ON CONFLICT DO UPDATE` in een D1-batch; `progress_mutation` voorkomt dubbel toepassen   |
| 5. Conflict       | Server geeft de actuele `revision` en `data_json` terug; client merget volgens de regels hieronder  |
| 6. Klaar          | Outbox-item verwijderen; `lastSyncedAt` bijwerken; bij fout blijft het item staan                   |

Conflictregels per datatype:

| Data         | Regel                                                               | Waarom                                                                   |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Instellingen | Last-write-wins op `clientUpdatedAt`, met `revision` als tiebreaker | Eenvoudig; een verkeerde moeilijkheid is snel hersteld                   |
| Beste scores | `max(existing, incoming)` per sleutel                               | Een oude telefoon mag een betere score niet overschrijven met een lagere |
| `unlocked`   | `max(existing, incoming)`                                           | Idem                                                                     |
| SRS/box      | Per item: de nieuwste review wint; bij gelijkspel de hoogste box    | Naïeve LWW kan een review verliezen                                      |
| Actief bord  | Niet syncen, of LWW met een "dit bord is van dit toestel"-label     | Twee toestellen die hetzelfde bord bewerken geeft anders verwarring      |
| Achievements | Unie van behaalde ids                                               | Alleen toevoegen, nooit verwijderen                                      |

Server-authoritative scores zijn alleen nodig als je een ranglijst of beloningen hebt. Bij een family-app is `max` genoeg; anti-cheat is niet zinvol als de client de score berekent. Zeg dat expliciet in de ADR, zodat niemand later een ingewikkeld anti-cheat-systeem bouwt voor een sterrenscore.

De D1-upsert en de `progress_mutation`-insert horen in **dezelfde batch**, anders kan een retry dubbel toepassen. D1's `batch()` is de atomiciteitsgrens; er is geen interactieve transactie ([Better Auth 1.5](https://better-auth.com/blog/1-5), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/)).

### 4.6 Quota en kosten

| Product         | Free                                                                            | Paid                                                                         | Voor deze app                       |
| --------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| Workers         | 100.000 requests/dag; 10 ms CPU                                                 | US$ 5/maand; 10M requests; 30M CPU-ms                                        | Gratis kan; betaald als CPU >10 ms  |
| D1              | 5M rows read/dag; 100k rows written/dag; 5 GB per account (500 MB per database) | 25B reads/maand; 50M writes/maand; 5 GB inbegrepen, daarna US$ 0,75/GB-maand | Free-tier vaak al genoeg; paid ruim |
| Durable Objects | 100k requests/dag; 13k GB-s/dag                                                 | 1M requests/maand; 400k GB-s/maand; US$ 12,50/M GB-s                         | Alleen fase 3                       |
| KV              | 100k reads/dag; 1.000 writes/dag; 1 GB                                          | 10M reads; 1M writes; 1 GB; US$ 0,50/GB-maand                                | Niet voor voortgang                 |
| R2              | 10 GB; 1M Class A; 10M Class B                                                  | US$ 0,015/GB-maand; US$ 4,50/M Class A; US$ 0,36/M Class B                   | Export/backups, later               |

Bronnen: [Workers-pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1-pricing](https://developers.cloudflare.com/d1/platform/pricing/), [DO-pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [KV-pricing](https://developers.cloudflare.com/kv/platform/pricing/), [R2-pricing](https://developers.cloudflare.com/r2/pricing/).

Dit zijn publieke prijzen en limieten op 2026-10-18; controleer ze vóór de beslissing. Voor een app met enkele tientallen gebruikers blijft het D1-gebruik klein; de gratis D1-limieten zijn ruim, de betaalde helemaal. De Workers-CPU-limiet is het enige echte risico: meet of de gekozen auth-methode onder 10 ms blijft. Reken in eerste instantie op **€0** en houd US$ 5/maand als fallback.

### 4.7 Kan het gratis?

| Onderdeel        | Gratis limiet                              | Wat deze app ongeveer gebruikt                                             |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Workers-requests | 100.000/dag                                | 5 kinderen × 2 uur × 120 heartbeats/uur ≈ 1.200/dag, plus auth en progress |
| Workers-CPU      | 10 ms/request                              | Onbekend; Google/passkey waarschijnlijk, scrypt niet                       |
| Subrequests      | 50/request                                 | Auth plus een handvol D1-queries                                           |
| D1-writes        | 100.000/dag                                | Enkele duizenden per dag                                                   |
| D1-reads         | 5M/dag                                     | Honderden tot duizenden                                                    |
| D1-opslag        | 5 GB (500 MB per database)                 | Enkele MB's                                                                |
| Workers Builds   | 3.000 minuten/maand, 1 gelijktijdige build | Enkele minuten per deploy                                                  |
| Static assets    | 20.000 bestanden, 25 MiB per bestand       | Ruim voldoende                                                             |

Bronnen: [Workers-limieten](https://developers.cloudflare.com/workers/platform/limits/), [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/), [Workers Builds-limieten](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).

**Conclusie:** gratis is realistisch voor een familie-app. De enige onzekerheid is de CPU-limiet. Test met een preview-login en de CPU-metrics van Cloudflare; pas bij een structurele overschrijding is US$ 5/maand nodig. Let op wat je op het gratis plan niet krijgt: 30 dagen D1 Time Travel (het is 7 dagen), read replication en een SLA. Die zijn voor deze app niet nodig.

### 4.8 Waar hosten we de backend?

De backend is geen aparte server maar een serverless API. De goedkoopste en eenvoudigste plek is de **zelfde Cloudflare Worker** die de site al host. Daarmee blijven auth en API same-origin, zijn er geen CORS-headers of third-party cookies, en is er geen tweede deploypad.

| Optie                                      | Gratis?                                   | Voordeel                                    | Nadeel voor deze app                                           |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **Cloudflare Workers + D1**                | Ja: 100k requests/dag, 10 ms CPU, D1 5 GB | Zelfde host, same-origin, geen extra vendor | 10 ms CPU is de enige risicofactor                             |
| Cloudflare Workers Paid                    | Nee, US$ 5/maand                          | Zelfde architectuur, 30 s CPU               | Kleine vaste kosten                                            |
| Vercel/Netlify Functions + Neon/Turso      | Ja                                        | Bekende tooling, gratis database            | Frontend verhuizen of CORS/cookies; extra vendor; cold starts  |
| Deno Deploy + Turso                        | Ja: 1M requests/maand, 1 GiB KV           | Eenvoudige runtime                          | Andere runtime; same-origin vraagt een proxy of frontendmove   |
| Neon Managed Better Auth                   | Ja, tot 60.000 MAU op Free                | Auth en Postgres in één                     | Hosted auth, externe origin, minder controle over configuratie |
| Supabase/Firebase/Appwrite                 | Ja                                        | Auth, database en dashboard                 | Vervangt Better Auth, vendor lock-in, externe requests         |
| Eigen VM (bijvoorbeeld Oracle Always Free) | Ja, meestal met creditcard                | Volledige controle, geen CPU-limiet         | TLS, backups, updates en monitoring zelf doen                  |

**Advies:** begin op Cloudflare Workers + D1. Het is de enige optie die de bestaande deployment houdt en same-origin blijft. De gratis limieten zijn voor een familie-app ruim; alleen de 10 ms CPU moet je meten. Kom je daar structureel boven, dan is US$ 5/maand goedkoper dan een migratie naar een ander gratis platform.

Bronnen: [Workers-pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1-pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Vercel-pricing](https://vercel.com/pricing), [Deno Deploy-pricing](https://deno.com/deploy/pricing), [Neon-pricing](https://neon.com/pricing), [Neon Managed Better Auth](https://neon.com/docs/auth/overview), [Turso-pricing](https://turso.tech/pricing), [Supabase-pricing](https://supabase.com/pricing).

## 5. Integratie in deze stack

### 5.1 Worker-routing naast static assets

De Worker heeft nu alleen `assets` en geen `main` ([`wrangler.jsonc`](../../wrangler.jsonc)). Om `/api/*` te kunnen bedienen, voeg je een `main` toe en laat je alleen die routes eerst naar de Worker gaan:

| Configuratie                | Waarde                                          | Effect                                                           |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `main`                      | Pad naar de Worker-entry                        | De Worker wordt gebundeld en gedeployed                          |
| `assets.directory`          | `./apps/games/dist`                             | Ongewijzigd                                                      |
| `assets.binding`            | `ASSETS`                                        | Nodig als de Worker een fallback naar assets doet                |
| `assets.not_found_handling` | `single-page-application`                       | Ongewijzigd; SPA-routes blijven werken                           |
| `assets.run_worker_first`   | `["/api/*"]`                                    | Alleen API-routes gaan eerst naar de Worker; assets blijven snel |
| `d1_databases`              | Binding `DB` + `database_id` + `migrations_dir` | Auth en progress                                                 |

Bron: [Static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/). Met een array blijft de asset-first routing voor de rest van de site intact; `run_worker_first: true` zou alle requests door de Worker laten lopen en de statische levering vertragen.

De Worker doet voor `/api/*` zelf de afhandeling en geeft voor onbekende API-paden een JSON-404. Voor niet-API-paden is de Worker niet nodig; de assets en de SPA-fallback doen het werk. Als je toch een fallback implementeert, gebruik `env.ASSETS.fetch(request)` ([Static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)).

### 5.2 CSP: minimaal `connect-src 'self'`

De huidige CSP heeft `connect-src 'none'` en `form-action 'none'` ([`_headers`](../../apps/games/public/_headers)). Same-origin `/api/auth` en `/api/progress` vereisen `connect-src 'self'`. Dat is een **verzwakking** van de huidige regel en dus een ADR-punt.

| Directive         | Nu             | Fase 1               | Fase 3                                 | Opmerking                                             |
| ----------------- | -------------- | -------------------- | -------------------------------------- | ----------------------------------------------------- |
| `default-src`     | `'self'`       | `'self'`             | `'self'`                               | Ongewijzigd                                           |
| `script-src`      | `'self'`       | `'self'`             | `'self'`                               | Geen inline scripts toevoegen                         |
| `connect-src`     | `'none'`       | `'self'`             | `'self'` (eventueel same-origin `wss`) | Auth/progress; geen vendor-origin                     |
| `form-action`     | `'none'`       | `'none'` of `'self'` | idem                                   | Alleen `'self'` als je echte form-posts of no-JS wilt |
| `img-src`         | `'self' data:` | `'self' data:`       | `'self' data:`                         | Geen avatars van externe hosts                        |
| `frame-ancestors` | `'none'`       | `'none'`             | `'none'`                               | Ongewijzigd                                           |

Als je alleen `fetch` gebruikt (zoals de Better Auth-client), kun je `form-action 'none'` laten staan. Wil je een gewone form-post als fallback, dan is `form-action 'self'` nodig. Kies één lijn en leg hem vast; meng ze niet per ongeluk.

Let op: `_headers` geldt alleen voor **statische assets**, niet voor responses die de Worker zelf genereert ([Headers](https://developers.cloudflare.com/workers/static-assets/headers/)). De API-responses hebben dus hun eigen headers nodig: minimaal `Content-Type: application/json`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` en een strikte CSP (`default-src 'none'; frame-ancestors 'none'`). Vergeet `X-Robots-Tag: noindex` niet, zodat API-antwoorden niet in zoekmachines belanden. De bestaande `noindex` en `nosniff` op de statische site blijven gewoon staan; ook de accountpagina's zijn niet indexeerbaar.

De `_headers`-regels worden per pad toegepast. Als je voor `/account/*` een andere CSP wilt dan voor de rest, moet je de bestaande CSP voor dat pad **detachen** met `! Content-Security-Policy` en opnieuw zetten; meerdere CSP-headers worden gecombineerd en dan geldt de strengste ([Headers](https://developers.cloudflare.com/workers/static-assets/headers/)). Dat is foutgevoelig; een globale `connect-src 'self'` is eenvoudiger en makkelijker te testen.

### 5.3 Client, TanStack Router en Zustand

- **Router:** voeg een route `/account` toe aan de bestaande programmatische routeboom ([`router.tsx`](../../apps/games/src/app/router.tsx)). De route is onafhankelijk van de spellen; als de backend ontbreekt, toont de pagina "accounts zijn niet beschikbaar" en blijft de rest werken.
- **Auth-client:** één `createAuthClient()` in de app-laag of in een account-feature. Geen baseURL nodig bij same-origin ([Client](https://better-auth.com/docs/concepts/client)). De client gebruikt `fetch` naar `/api/auth`; dat valt binnen `connect-src 'self'`.
- **Sessie:** gebruik `useSession()` alleen op de accountpagina en in de sync-laag, niet in elke game. De spellen mogen niet afhankelijk zijn van een sessie.
- **Zustand:** de stores laden nu bij module-init uit `localStorage` ([`use-sudoku-store.ts`](../../libs/features/sudoku-game/model/use-sudoku-store.ts)). Voeg een expliciete `applySyncedState`-actie toe per store, of een generieke sync-adapter die `load`/`save` vervangt. Hydrateer nooit door de hele store te vervangen tijdens een render; dat veroorzaakt flikkering en kan een lopende beurt overschrijven.
- **Volgorde:** lokale state renderen → sessie ophalen → serverstate ophalen → mergen → lokaal opslaan → UI bijwerken. De app is dan direct bruikbaar, ook offline.
- **Geen SSR:** de app is een SPA, dus er is geen hydration-mismatch tussen server en client. Dat maakt de sync een stuk eenvoudiger dan in een SSR-framework.

### 5.4 Nx en FSD

| Laag    | Project                  | Inhoud                                                            |
| ------- | ------------------------ | ----------------------------------------------------------------- |
| Entity  | `libs/entities/progress` | Types, schema-versies, pure merge- en migratiefuncties per spel   |
| Feature | `libs/features/account`  | Auth-client, sessiecomponenten, login/logout, accountverwijdering |
| Feature | `libs/features/sync`     | Outbox, sync-adapterregistry, statusindicator, retry              |
| Page    | `libs/pages/account`     | Account- en ouderpagina                                           |
| App     | `apps/games/src/app`     | Route `/account`, provider, feature-flag                          |
| App     | `apps/api`               | Worker-entry, Better Auth-config, `/api/*`-routes, D1             |
| Shared  | `libs/shared/lib`        | Kleine helpers die zowel browser als Worker mogen gebruiken       |

Deze indeling houdt de FSD-regels intact: `apps/api` mag alleen `entities` en `shared` importeren, nooit `features`, `widgets`, `pages` of React. De Worker heeft geen React nodig. Zet in `project.json` tags als `["layer:app", "scope:api", "type:app"]` en breid de Fallow-zones uit met een `api`-zone die alleen `entities` en `shared` toestaat ([`.fallowrc.json`](../../.fallowrc.json)). Zonder die zone valt `apps/api` buiten de boundary-check.

Een alternatief is de Worker-entry in `apps/games/worker/` plaatsen. Dat is minder ceremony, maar het vermengt browser- en servercode in één Nx-project en maakt de boundary-check zwakker. Voor een spike kan het; voor fase 1 is `apps/api` netter. De keuze hangt af van hoeveel servercode je verwacht: twee auth-routes en één progress-endpoint rechtvaardigen nog geen eigen app, maar zodra er een ouder-dashboard en retention-job bijkomen wel.

### 5.5 Kwaliteitsgate

| Check                    | Wat je moet toevoegen                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm run ts-only`       | Worker-entry en alle servercode in `.ts`; geen gegenereerde `.js` committen                                         |
| `pnpm run typecheck`     | Aparte `tsconfig.worker.json` met Worker-types; voorkom DOM/Worker-conflicten                                       |
| `pnpm run test:coverage` | Node-tests voor merge/migratie; Worker-integratietests met lokale D1 via `@cloudflare/vitest-pool-workers`          |
| `pnpm run build`         | `nx run-many -t build -p games api` of equivalente target                                                           |
| `pnpm run boundaries`    | `apps/api` in de Fallow-zones; geen import uit features/pages                                                       |
| `pnpm run fsd`           | Steiger draait op `libs` en `apps/games/src`; Worker-code valt erbuiten, dus houd de pure logica in `libs/entities` |
| `pnpm run e2e`           | Minimaal: spelen zonder login, login op `/account`, sync, offline fallback                                          |

De `tsconfig`-splitsing is geen detail: `@cloudflare/workers-types` en de DOM-lib definiëren beide `Request`, `Response` en `crypto`, en kunnen elkaar in de weg zitten. Gebruik een aparte config voor de Worker en laat de webconfig die bestanden uitsluiten. Test daarna `pnpm run typecheck` echt, niet alleen `tsc --noEmit` op één bestand.

Als `wrangler.jsonc` naar een TypeScript-`main` wijst, bundelt `wrangler deploy` de Worker zelf; dan hoeft `pnpm run build` alleen de frontend te bouwen. Wijst `main` naar een vooraf gebouwde `apps/api/dist/worker.js`, breid dan het buildscript uit met de API-build. Laat dat niet impliciet door de deploycommando afhangen.

### 5.6 Feature-flag en geleidelijke uitrol

- **Build-time flag:** `VITE_ACCOUNTS_ENABLED` is publiek (het staat in de bundle) en mag geen geheim bevatten. Zet de flag uit in de eerste deploy; de route en de account-UI blijven dan verborgen.
- **Server-side flag:** `ACCOUNTS_ENABLED` als Workers-variabele; als die `false` is, geven `/api/auth/*` en `/api/progress/*` een 404 of 503. Zo kun je de Worker al deployen zonder de functie te openen.
- **Uitrol:** deploy de Worker met de flag uit → test met het ouderaccount van de eigenaar → zet de flag aan voor de eigenaar → daarna pas de route zichtbaar maken. Een verborgen route is geen beveiliging, maar wel een rollback-mogelijkheid.
- **Previews:** `preview_urls` staat aan in de repo. Auth op previews vraagt een aparte D1, een aparte secret en `trustedOrigins` voor elke preview-origin. Doe dat niet in fase 1; zet auth op previews uit of gebruik een wegwerp-database.

### 5.7 Next.js of de huidige stack?

**Blijf bij de huidige stack.** Next.js lost hier niets op en kost een hoop migratiewerk:

- De app is een SPA met client-side spellen. SSR of React Server Components voegt geen gebruikerswaarde toe; de spellen hebben geen server-rendered HTML nodig.
- De site is `noindex` en heeft geen publieke SEO-noden. Dat is juist het domein waar Next.js waarde toevoegt.
- Better Auth heeft geen Next.js nodig. De handler werkt met standaard `Request`/`Response` in de Worker; de React-client is framework-agnostisch.
- Next.js op Cloudflare vraagt OpenNext of een statische export. Dat is meer runtime, meer configuratie en zwaarder dan static assets, terwijl de gratis CPU-limiet juist bij een statische SPA goed uitkomt.
- Een overstap betekent de router, pagina's, providers, tests, CSP en deploy opnieuw doen. De Nx/FSD-grenzen en Steiger zijn op de huidige `libs` ingericht; een app-router met server- en clientcomponenten maakt die scheiding onduidelijker.
- De auth- en datalaag zijn bij een latere migratie alsnog bruikbaar. Je zit dus niet vast aan Vite.

Next.js wordt pas interessant voor een **aparte** server-gerenderde ouder-dashboard of marketingpagina's. Doe dat als een extra app, niet als vervanging van de games. Zie ook [OpenNext voor Cloudflare](https://opennext.js.org/cloudflare).

### 5.8 TanStack Query?

**Niet nu, wel vanaf fase 1 — en alleen voor serverstate.** TanStack Query is geen vervanging voor de Zustand-stores of de sync-engine.

| Gebruik                                          | Wel of niet                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Sessie en profielen                              | Wel; of Better Auth's `useSession` gebruiken en alleen de profielen in Query zetten |
| Initiële progress-fetch en ouderoverzicht        | Wel                                                                                 |
| Mutations: profiel aanmaken, account verwijderen | Wel, met invalidatie                                                                |
| Spellogica en lokale voortgang                   | **Niet**; dat blijft in Zustand + `localStorage`                                    |
| Offline outbox en merge                          | **Niet**; dat is een eigen, durabele sync-laag                                      |

Waarom:

- Query geeft cache, deduplicatie, retries, achtergrondverversing en invalidatie. Dat is precies wat de account- en ouder-UI nodig heeft.
- Query is **geen durabele outbox**. `persistQueryClient` kan cache en mutaties bewaren, maar het is geen vervanging voor idempotente delta's, backoff en conflictregels. Die horen in de sync-laag uit [ADR 0012](../adr/0012-optionele-accounts-en-sync.md).
- Twee state-lagen naast elkaar vragen een harde grens: **serverstate in Query, lokale state in Zustand**. Nooit hetzelfde veld in beide bijwerken.
- Zonder backend voegt Query alleen bundle-grootte en een extra provider toe. De spellen laden nu synchroon uit `localStorage`; dat moet zo blijven.
- TanStack Router en Query werken goed samen, maar de huidige routes gebruiken geen loaders. Voeg `ensureQueryData` pas toe als een route echt serverdata nodig heeft; de games mogen nooit op een query wachten om te starten.

## 6. Privacy en compliance

Dit is geen juridisch advies. De conclusies hieronder zijn ontwerpkeuzes; de eigenaar moet ze met de Autoriteit Persoonsgegevens, een jurist of in ieder geval met het eigen verwerkingsregister laten toetsen.

### 6.1 AVG en kinderen

- De AVG is van toepassing op elke organisatie die persoonsgegevens verwerkt, ook kleine organisaties en individuen ([AP: AVG in het kort](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/de-avg-in-het-kort)).
- **In Nederland is de leeftijdsgrens voor geldige toestemming bij online diensten 16 jaar**, niet 13. De AP zegt expliciet: kinderen onder de 16 kunnen zelf geen geldige toestemming geven; een ouder of verzorger moet toestemming geven. Andere EU-landen mogen 13 hanteren, maar Nederland doet dat niet ([AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)).
- Kinderen van 12 jaar en ouder mogen hun toestemming zelf intrekken ([AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)). Dat is een apart recht naast de toestemming door de ouder.
- De AP benadrukt dat de informatie begrijpelijk moet zijn voor het kind, en dat je moet kunnen aantonen dat de ouder toestemming heeft gegeven ([AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)).
- De AVG-beginselen zijn rechtmatigheid, doelbinding, dataminimalisatie, juistheid, opslagbeperking en vertrouwelijkheid/integriteit; de verantwoordingsplicht komt daar overheen ([AP: AVG in het kort](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/de-avg-in-het-kort)).

**Ontwerpconsequentie:** als je alleen een ouderaccount hebt en het kind speelt op een lokaal profiel, verwerk je veel minder kindgegevens. Toch is een profielslot met voortgang herleidbaar tot een kind (de ouder weet welk slot bij welk kind hoort), dus het blijft persoonsgegeven. Minimaliseer het: geen naam, geen geboortedatum, geen e-mail, geen foto, geen locatie.

### 6.2 COPPA (VS)

- COPPA definieert een kind als iemand onder 13 jaar ([16 CFR 312.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.2)).
- "Personal information" omvat onder meer een naam, online contactinformatie, een gebruikersnaam die als contactinfo werkt, een **persistent identifier** (cookie, IP-adres, device-id) en geolocatie ([16 CFR 312.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.2)).
- De regel vereist ouderlijke toestemming vóór het verzamelen ([16 CFR 312.5](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.5)) en bevat bewaar- en verwijderverplichtingen ([16 CFR 312.10](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.10)).
- De "operator" is een commerciële website of online dienst; een non-profit die onder de FTC Act is vrijgesteld, valt er mogelijk buiten ([16 CFR 312.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.2)). Of deze hobby-app "commercial" is, is een juridische vraag. Ga er niet automatisch van uit dat COPPA niet geldt alleen omdat er geen geld wordt verdiend.

**Ontwerpconsequentie:** als de site op kinderen in de VS is gericht en je verzamelt een cookie, IP-adres of profiel-id, dan is COPPA al snel relevant. De veiligste route is geen accounts voor kinderen, geen advertenties, geen profiling en geen tracking. Als je toch een ouderaccount met e-mail wilt, is "verifieerbare ouderlijke toestemming" een strengere standaard dan een enkele checkbox; laat dat juridisch toetsen.

### 6.3 ICO Age Appropriate Design Code (VK)

De ICO AADC is een Britse statutory code met 15 flexibele standaarden. De kern: het belang van het kind staat voorop, standaard hoge privacy, minimale data, geen nudging om meer data te geven, geen profiling die nadelig is, en geolocatie standaard uit ([ICO AADC](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/)).

De code is niet direct Nederlands recht, maar is een bruikbare ontwerpchecklist. Deze app voldoet al aan veel punten: geen analytics, geen advertenties, geen tracking, geen remote images, geen chat. Voeg je accounts toe, dan moet je de "high privacy by default"-standaard expliciet toepassen: geen zichtbare profielen, geen publieke scores, geen vriendenlijst, geen meldingen die om meer data vragen.

### 6.4 Dataminimalisatie, bewaartermijn en verwijdering

| Data                | Bewaaradvies                                               | Toelichting                                                               |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Lokale voortgang    | Tot de gebruiker wist                                      | Blijft op het toestel; geen serverkopie                                   |
| Sessies             | 7 dagen, sliding; direct intrekken bij logout              | Better Auth-default; korter kan                                           |
| Ouderaccount        | Zolang het account bestaat                                 | E-mail alleen voor herstel/toestemming                                    |
| Kindprofiel         | Zolang het account bestaat, of korter                      | Geen naam/e-mail; slot + avatar                                           |
| Voortgang           | 12 maanden inactief, daarna verwijderen of anonimiseren    | Voorstel; de eigenaar moet dit vaststellen                                |
| Toestemmingsbewijs  | Zolang het account bestaat + korte administratieve termijn | Bewijs dat de ouder toestemming gaf                                       |
| Logs                | 7–30 dagen, zonder PII                                     | Alleen eventtype en pseudonieme id                                        |
| Backups/Time Travel | D1 Time Travel: 7 dagen free, 30 dagen paid                | Verwijderen uit de live database betekent niet meteen weg uit Time Travel |

Bronnen: [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/), [AP: opslagbeperking](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/de-avg-in-het-kort), [Better Auth-sessies](https://better-auth.com/docs/concepts/session-management).

Het verwijderrecht betekent concreet: een knop "verwijder mijn account" die (1) exporteert wat de ouder wil bewaren, (2) alle `player`-rijen en `progress`-rijen verwijdert, (3) de Better Auth-user en sessies verwijdert, (4) het toestel terugzet naar lokaal-only. Better Auth's `deleteUser` doet de user/sessions; de cascade naar `player` en `progress` moet je zelf in dezelfde batch of via `ON DELETE CASCADE` regelen ([Gebruikers en accounts](https://better-auth.com/docs/concepts/users-accounts)). Test dat er geen verweesde rijen achterblijven.

### 6.5 EU-dataregio, DPA en register

- D1 kan met een **jurisdictie** worden aangemaakt: `eu` houdt de primary en de read-replica's binnen de EU. Een locatiehint `weur` kiest West-Europa ([D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)).
- De jurisdictie beperkt waar de database draait en data opslaat; de Worker kan nog steeds vanuit andere regio's draaien. Cloudflare is een Amerikaanse verwerker; gebruik de Cloudflare DPA en de subprocessorslijst ([Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/), [subprocessors](https://www.cloudflare.com/gdpr/subprocessors/)).
- De AP zegt dat een verwerkingsregister in de regel verplicht is en dat een privacyverklaring altijd verplicht is ([AP: verantwoordingsplicht](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/verantwoordingsplicht)). Er is een beperkte uitzondering voor organisaties met minder dan 250 medewerkers, maar die geldt niet als de verwerking niet incidenteel is of een risico vormt (artikel 30 lid 5 AVG, [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)). Accounts en voortgang van kinderen vallen al snel in die categorie; houd dus een register bij.
- Beoordeel of een DPIA nodig is. De AP noemt onder meer systematische beoordeling, grootschalige verwerking, bijzondere gegevens en systematische monitoring als criteria; de DPIA-lijst is niet uitputtend ([AP: DPIA](https://www.autoriteitpersoonsgegevens.nl/themas/avg-privacy/praktisch-avg/data-protection-impact-assessment-dpia)). Voor een kleine family-app met minimale data is een volledige DPIA waarschijnlijk niet nodig, maar een korte risicoanalyse is verstandig. Bij twijfel: wel doen.
- Als je een e-mailprovider toevoegt, is dat een extra verwerker. Regel een DPA, noem hem in de privacyverklaring en in het verwerkingsregister, en kies een EU-regio als dat kan.

### 6.6 Wat mag je loggen?

| Wel                                     | Niet                                           |
| --------------------------------------- | ---------------------------------------------- |
| Eventtype (login, sync, delete)         | E-mailadres, wachtwoord, token, cookie         |
| Pseudonieme user-id of een hash daarvan | IP-adres en user-agent in applicatielogs       |
| Foutcode en tijdstip                    | Volledige request-body of `progress.data_json` |
| Duur en status van een sync             | Inhoud van een kindprofiel of naam             |

Better Auth slaat standaard `ipAddress` en `userAgent` op in de sessietabel ([Database](https://better-auth.com/docs/concepts/database)). Dat is nuttig voor misbruikdetectie, maar het zijn persoonsgegevens. Minimaliseer de bewaartermijn, log ze niet nog eens extra, en neem ze op in het register. Als je ze niet nodig hebt, is een kortere sessie of een aangepast schema beter dan "we loggen alles voor de zekerheid".

Als "state tracking" ook productanalytics betekent (welke spellen worden gespeeld, waar haken kinderen af), is dat een aparte verwerking. Geaggregeerde tellingen kunnen alsnog persoonsgegevens zijn als ze tot een kind of gezin herleidbaar zijn. Zonder analytics-SDK kun je hooguit server-side, geanonimiseerd en kort tellen; leg dat in de ADR en de privacyverklaring vast. Voeg geen client-side tracker toe om dit te "versimpelen".

**Publieke repo:** zet geen echte namen, e-mailadressen, screenshots van een gezin, productie-exports of `.dev.vars` in de repository. Gebruik synthetische testdata ("Profiel 1", `test@example.invalid`) en `.invalid`-domeinen. Dat is niet alleen een privacymaatregel, maar ook een eis uit `AGENTS.md` en ADR 0001.

## 7. Alternatieven en afweging

| Optie                                       | Auth                   | Data                 | Externe requests                  | Kosten                                              | Lock-in                        | Verdict                                                            |
| ------------------------------------------- | ---------------------- | -------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| **Better Auth + D1 in dezelfde Worker**     | Eigen, MIT             | Eigen D1             | Nee, same-origin                  | US$ 5/maand Workers + D1-gebruik                    | Laag: SQLite, standaardschema  | **Beste fit** als backend nodig is                                 |
| Supabase                                    | Hosted auth + Postgres | Supabase             | Ja, browser praat met project-URL | Free 50k MAU; Pro US$ 25/maand                      | Middel: auth/users en Postgres | Krachtig, maar CSP en vendor-relatie                               |
| Clerk                                       | Hosted auth            | Clerk                | Ja, hosted frontend/API           | Hobby free 50k MRU; Pro US$ 20/maand (jaarbetaling) | Hoog: users, sessies, UI       | Te zwaar en te veel third-party                                    |
| Auth.js                                     | Eigen, open source     | Eigen                | Nee, same-origin                  | €0                                                  | Laag                           | Auth.js is in 2026 onderdeel van Better Auth; kies dan Better Auth |
| Firebase Auth                               | Hosted auth            | Firebase             | Ja, Google                        | Gratis tot 50k MAU; daarna betaald                  | Hoog                           | Niet passend bij "geen externe requests"                           |
| PocketBase                                  | Eigen, open source     | SQLite in één binary | Nee, same-origin                  | Eigen server                                        | Laag                           | Vereist een server/container; niet Workers-native                  |
| Eigen sessie-cookie op Workers              | Eigen                  | Eigen D1/KV          | Nee                               | US$ 5/maand                                         | Laag                           | Weinig code, maar je bezit alle auth-risico's                      |
| Geen auth: lokale profielen + export/import | Geen                   | Lokaal               | Nee                               | €0                                                  | Geen                           | **Beste fit voor nu**                                              |

Bronnen: [Supabase-pricing](https://supabase.com/pricing), [Clerk-pricing](https://clerk.com/pricing), [Auth.js](https://authjs.dev/), [Firebase-pricing](https://firebase.google.com/pricing), [PocketBase](https://pocketbase.io/), [Better Auth-introductie](https://better-auth.com/docs/introduction).

Toelichting:

- **Supabase** is technisch sterk, maar de browser-client praat met de Supabase-project-URL. Dat vraagt `connect-src` voor die origin en een derde partij in de keten. Self-hosting kan, maar dan beheer je Postgres zelf; dat is meer dan deze app nodig heeft ([Supabase Auth-quickstart](https://supabase.com/docs/guides/auth/quickstarts/react), [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting), [Supabase-pricing](https://supabase.com/pricing)).
- **Clerk** is een hosted dienst met veel kant-en-klare UI. De client praat met Clerk, en de gratis tier is royaal, maar je levert gebruikersdata en sessies in bij een derde partij. Voor een kinderapp is dat een grote sprong ([Clerk-pricing](https://clerk.com/pricing), [Clerk React-quickstart](https://clerk.com/docs/react/getting-started/quickstart)).
- **Auth.js** was de bekende alternatieve bibliotheek, maar is in 2026 onderdeel van Better Auth geworden ([Auth.js](https://authjs.dev/)). Een nieuwe implementatie op Auth.js is daarom geen logische keuze meer.
- **Firebase Auth** is gratis tot 50k MAU, maar de client praat met Google en de data staat bij Google. Dat botst met de CSP en met de wens om geen externe requests te doen ([Firebase-pricing](https://firebase.google.com/pricing), [Firebase Auth](https://firebase.google.com/docs/auth)).
- **PocketBase** is een mooie self-hosted optie: één binary, SQLite, auth en realtime. Maar het is geen Workers-native oplossing; je hebt een VPS of container nodig. Dat is een veel grotere infrastructurele stap dan D1 ([PocketBase](https://pocketbase.io/)).
- **Eigen sessie-cookie** is verleidelijk: een paar honderd regels TypeScript, geen dependency. Maar je moet dan zelf wachtwoord-hashing, CSRF, rotatie, rate limiting, e-mailverificatie en accountverwijdering goed doen. Better Auth doet dat al, met een D1-adapter. Tenzij je bewust een minimale passkey-only flow bouwt, is zelf doen meer risico dan winst.
- **Geen auth** is geen "mindere" optie. Het is de enige optie die de huidige privacy- en CSP-belofte volledig houdt. Bouw lokale profielen en export/import; voeg pas een backend toe als de eigenaar een concrete functie wil die lokaal niet kan.
- **Publieke repo en sleutels:** een publishable/anon key van een hosted provider is meestal geen geheim, maar een service-role- of server-key wel. Zet die nooit in de bundle of in de repo. Bij self-hosted Better Auth staat er geen vendor-key in de browser; alleen de Worker heeft een secret ([Supabase API-keys](https://supabase.com/docs/guides/getting-started/api-keys)).

## 8. Gefaseerd migratiepad

| Fase | Doel                                                  | Backend              | Auth                      | Data                              | ADR                             | CSP                                        | Secrets              | Tests                          | Rollback                            |
| ---- | ----------------------------------------------------- | -------------------- | ------------------------- | --------------------------------- | ------------------------------- | ------------------------------------------ | -------------------- | ------------------------------ | ----------------------------------- |
| 0    | Nu: statisch                                          | Geen                 | Geen                      | Lokaal                            | Geen                            | Ongewijzigd                                | Geen                 | Bestaand                       | n.v.t.                              |
| 0.5  | Lokale profielen + export/import                      | Geen                 | Geen                      | Lokaal, per profiel               | Geen (wel docs)                 | Ongewijzigd                                | Geen                 | Storage/migratie/export        | Oude key blijft leesbaar            |
| 1    | Optioneel ouderaccount + sync van instellingen/scores | Worker + D1          | Ouder-passkey (of e-mail) | `player`, `progress`              | 0012 auth/backend, 0013 privacy | `connect-src 'self'`                       | `BETTER_AUTH_SECRET` | Auth, sync, offline, CSRF      | Flag uit, `main` weg, CSP terug     |
| 2    | Volledige voortgang + ouder-dashboard                 | Zelfde               | Zelfde                    | Uitgebreide `progress`, `consent` | 0014 sync/datamodel             | Ongewijzigd                                | Zelfde               | Merge, retentie, export/delete | Sync-endpoints uit, data exporteren |
| 3    | Multiplayer                                           | D1 + Durable Objects | Zelfde                    | DO per room, D1 voor profielen    | 0015 multiplayer                | `connect-src 'self'` (+ same-origin `wss`) | Zelfde               | Realtime, reconnect, misbruik  | Rooms uit, DO-binding weg           |

### Fase 0 — nu (statisch)

- Geen code- of configwijziging nodig.
- Houd de bestaande localStorage-keys en de `games.sound.v1`-key intact.
- Documenteer in de ADR dat de app bewust statisch is en dat accounts een nieuwe ADR vereisen (dat staat al in ADR 0001).

### Fase 0.5 — lokale profielen en export/import

- **Wat:** een profielkeuze op de homepagina, een namespace per profiel (bijvoorbeeld `games.p1.<spel>.v1`), en een export/import-knop die één JSON-bestand met alle profielen maakt.
- **Waarom:** dit lost broers/zussen op één apparaat op zonder server. Het is ook de fallback als een account later wordt verwijderd.
- **Migratie:** lees de bestaande keys als profiel 1; schrijf nieuwe keys voor extra profielen. Verwijder de oude key pas als de migratie is getest.
- **Tests:** laden van oude key, profiel scheiden, export/import rondreis, ongeldige JSON, ontbrekende velden.
- **Rollback:** de oude key blijft bestaan; de app kan terug naar één profiel.
- **Geen ADR nodig**, maar leg het formaat vast in `docs/` zodat een latere sync erop kan voortbouwen.

### Fase 1 — optioneel ouderaccount en sync van instellingen/scores

- **ADR 0012:** auth- en backendontwerp. Beantwoord: waarom een backend, welke gegevens, welke origin, welke CSP, welke secrets, welke rollback.
- **ADR 0013:** privacy en gegevensverwerking. Beantwoord: wie is verwerkingsverantwoordelijke, welke grondslag, welke bewaartermijn, welke verwerkers (Cloudflare, eventueel e-mail), hoe worden ouderlijke toestemming en verwijdering geregeld.
- **CSP:** `connect-src 'self'`; `form-action` alleen `'self'` als je echte forms gebruikt. Dit is een verzwakking; leg het uit in de ADR.
- **Secrets:** `BETTER_AUTH_SECRET` als Workers-secret; `BETTER_AUTH_URL` als var; D1-binding in `wrangler.jsonc`.
- **Data:** alleen `player` + `progress` voor settings en scores; geen actieve borden.
- **Auth:** ouder-passkey, eventueel met ouder-e-mail voor herstel. Geen kindlogin.
- **Tests:** login/logout, sessie-cookie, CSRF met vreemde origin, rate limit, offline sync, retry/idempotentie, accountverwijdering, geen login = geen regressie.
- **Rollback:** `VITE_ACCOUNTS_ENABLED=false`, `ACCOUNTS_ENABLED=false`, `main` uit `wrangler.jsonc`, CSP terug naar `connect-src 'none'`. De app werkt weer volledig lokaal. Bewaar de D1-data eerst als export en verwijder hem pas na de afgesproken termijn.

### Fase 2 — volledige voortgang en ouder-dashboard

- **ADR 0014:** datamodel, merge-regels, retentie en dashboardtoegang.
- **Data:** SRS/franse voortgang per item, achievements, grove statistieken. Gebruik per-item merge of een event-log als LWW aantoonbaar verkeerd gaat.
- **Dashboard:** alleen voor de ouder/verzorger; geen publieke profielen, geen ranglijst, geen chat. Toon voortgang per slot, niet per kindnaam.
- **Privacy:** consent-record, export, delete, retention-job (Cron Trigger of handmatige beheerstaak). D1 Time Travel blijft een aandachtspunt.
- **CSP:** ongewijzigd.
- **Rollback:** sync-endpoints uitzetten; dashboard-only route verwijderen; data exporteren en bewaren.

### Fase 3 — multiplayer

- **ADR 0015:** realtime-architectuur, rooms, autoritatieve state, misbruikpreventie, kosten.
- **Techniek:** Durable Objects per room/sessie; D1 voor profielen en persistente voortgang; WebSockets met hibernation. D1 is niet geschikt als realtime spelserver ([D1-limieten](https://developers.cloudflare.com/d1/platform/limits/), [DO-pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)).
- **Veiligheid:** alleen spelen met bekenden (code/link), geen publieke matchmaking, geen chat, geen user-generated content, geen namen van kinderen. Dit is een product- en veiligheidsbeslissing, niet alleen een technische.
- **CSP:** `connect-src 'self'` blijft; voeg alleen same-origin `wss` toe als de browser dat expliciet eist.
- **Rollback:** rooms uitzetten, DO-binding verwijderen, D1 behouden.

## 9. Open vragen

1. **Is cross-device sync echt nodig?** Zo nee: bouw alleen fase 0.5 en done. Zo ja: welke twee apparaten en welke data moeten echt delen?
2. **Ouderaccount met passkey of met e-mail/wachtwoord?** Passkey is privacyvriendelijker en veiliger, maar herstel is lastiger. E-mail/wachtwoord is bekender, maar vraagt een e-mailprovider en een resetflow.
3. **Mag er een externe e-mailprovider komen?** Magic link en wachtwoordreset zijn zonder e-mail niet mogelijk. Dat is een expliciete uitzondering op "geen externe requests" en vraagt een ADR, DPA en privacyverklaring.
4. **Welke data syncen we?** Alleen instellingen en scores, of ook actieve borden en SRS? Elke extra categorie vergroot de merge-complexiteit en de privacy-impact.
5. **Wie is de verwerkingsverantwoordelijke en wat is de grondslag?** De eigenaar is waarschijnlijk een particulier; dat maakt de AVG niet anders, maar wel de praktische invulling van het register en de privacyverklaring.
6. **Wat is de bewaartermijn en wanneer is een account "inactief"?** 12 maanden is een voorstel, geen wet. De eigenaar moet dit vaststellen en kunnen uitleggen.
7. **Is de site op kinderen in de VS gericht?** Zo ja, dan is COPPA mogelijk van toepassing en is "verifieerbare ouderlijke toestemming" een strengere eis. Zo nee, dan nog steeds geen tracking of advertenties.
8. **Mag de D1 `database_id` in de publieke repo?** Het is geen secret, maar wel infrastructuurmetadata. Kies een lijn en documenteer die.
9. **Wat doen we met previews?** Auth op previews met dezelfde D1 en dezelfde secret is onverstandig. Zet auth daar uit of gebruik een wegwerp-database.
10. **Willen we ooit multiplayer?** Zo ja, reserveer daar nu geen D1-architectuur voor; Durable Objects zijn een aparte laag en een aparte ADR.
11. **Hoe koppelt een kindertoestel zonder volledige ouder-sessie?** Een gedeelde login is onveilig; een beperkte device-sessie of sync-only token is extra maatwerk bovenop Better Auth. Bepaal dit vóór fase 1.

## 10. Beslissing voor de eigenaar

**Beste optie nu:** fase 0.5. Bouw lokale profielen en export/import, zonder backend, zonder accounts en zonder CSP-wijziging. Daarmee lost de app de meest voorkomende situatie op en blijft de huidige belofte intact.

**Beste optie als cross-device sync echt nodig is:** fase 1 met Better Auth 1.7.10 in dezelfde Worker, D1 in de EU, en een ouderaccount met passkey. Sync alleen instellingen, beste scores en grove voortgang. Geen kindlogin, geen kind-e-mail, geen magic link of OAuth in fase 1.

De eigenaar moet dan expliciet het volgende beslissen:

1. **ADR 0012 goedkeuren:** auth- en backendontwerp, zelfde origin, D1, `run_worker_first`, CSP-wijziging, secrets en rollback.
2. **ADR 0013 goedkeuren:** privacy en gegevensverwerking, inclusief verwerkingsverantwoordelijke, grondslag, bewaartermijn, verwerkers (Cloudflare, eventueel e-mail), ouderlijke toestemming en verwijdering.
3. **Auth-methode kiezen:** passkey (aanbevolen) of e-mail/wachtwoord. Als het e-mail wordt: keur dan ook de e-mailprovider en de DPA goed.
4. **Sync-scope kiezen:** alleen instellingen en scores, of ook actieve borden en SRS. Elke uitbreiding vraagt een aparte ADR of een expliciete wijziging van ADR 0014.
5. **Bewaartermijn en verwijderprocedure vaststellen:** 12 maanden inactiviteit is een voorstel, geen wet. Leg uit hoe een ouder exporteert en verwijdert.
6. **CPU en plankeuze:** meet de CPU van de gekozen auth-methode; het gratis plan volstaat als die onder 10 ms blijft, anders is Workers Paid (US$ 5/maand) nodig.
7. **D1 `database_id` en previews beleid kiezen:** wat komt in de publieke repo, en is auth op previews uit of apart?

**Zonder ADR 0012 en 0013 komt er geen productie-auth. Zonder ADR 0014 geen volledige voortgangssync of ouder-dashboard. Zonder ADR 0015 geen multiplayer.** Als de eigenaar deze vragen nu niet wil beantwoorden, is dat een geldig antwoord: blijf bij fase 0.5.

## Bronnen

### Better Auth

- [Introductie](https://better-auth.com/docs/introduction) — framework-agnostisch, plugin-ecosysteem.
- [Installatie](https://better-auth.com/docs/installation) — secret, baseURL, database, CLI, Cloudflare Workers-tab, AsyncLocalStorage.
- [Database](https://better-auth.com/docs/concepts/database) — adapters, core schema, migraties, schema-validatie, D1.
- [SQLite-adapter](https://better-auth.com/docs/adapters/sqlite) — Kysely/D1-route.
- [Drizzle-adapter](https://better-auth.com/docs/adapters/drizzle) — schema en `drizzle-kit`.
- [PostgreSQL-adapter](https://better-auth.com/docs/adapters/postgresql) — `pg.Pool`.
- [Sessiebeheer](https://better-auth.com/docs/concepts/session-management) — expiry, freshness, cookie-cache, revoke.
- [Security](https://better-auth.com/docs/reference/security) — scrypt, CSRF, origin, cookies, rate limiting, IP-headers.
- [Rate limit](https://better-auth.com/docs/concepts/rate-limit) — defaults, storage, `cf-connecting-ip`.
- [Cookies](https://better-auth.com/docs/concepts/cookies) — prefix, SameSite, Secure, cookie-cache.
- [E-mail](https://better-auth.com/docs/concepts/email) — verificatie en wachtwoordreset.
- [Gebruikers en accounts](https://better-auth.com/docs/concepts/users-accounts) — update, delete, change password.
- [Client](https://better-auth.com/docs/concepts/client) — React/client, same-origin.
- [Anonymous-plugin](https://better-auth.com/docs/plugins/anonymous) — guest-accounts en linken.
- [Passkey-plugin](https://better-auth.com/docs/plugins/passkey) — WebAuthn/FIDO2.
- [Magic link](https://better-auth.com/docs/plugins/magic-link) — e-mailtoken, expiry, rate limit.
- [Organization-plugin](https://better-auth.com/docs/plugins/organization) — leden, rollen, uitnodigingen.
- [Device authorization](https://better-auth.com/docs/plugins/device-authorization) — RFC 8628.
- [Telemetrie](https://better-auth.com/docs/reference/telemetry) — standaard uit, wat er wordt verzonden.
- [Better Auth 1.5](https://better-auth.com/blog/1-5) — D1 als first-class database, `batch()`, geen interactieve transacties.
- [npm `better-auth`](https://registry.npmjs.org/better-auth/latest) — versie 1.7.10, MIT, ESM.

### Cloudflare

- [Workers-limieten](https://developers.cloudflare.com/workers/platform/limits/) — CPU, memory, subrequests, statische bestanden.
- [Workers-pricing](https://developers.cloudflare.com/workers/platform/pricing/) — gratis plan en US$ 5/maand.
- [Node.js-compatibiliteit](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) — ondersteunde API's.
- [Node `crypto`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/) — scrypt wel, argon2 niet.
- [Compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) — `nodejs_compat` standaard vanaf 2026-08-04.
- [Static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/) — `main`, `run_worker_first`, `ASSETS`.
- [Static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/) — `_headers` alleen voor static assets.
- [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) — `wrangler secret put`, `.dev.vars`.
- [Environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) — vars versus secrets.
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) — build/deploy bij push.
- [D1-limieten](https://developers.cloudflare.com/d1/platform/limits/) — 10 GB, 2 MB rij, 30 s query, Time Travel.
- [D1-pricing](https://developers.cloudflare.com/d1/platform/pricing/) — rows read/written, storage.
- [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/) — `eu`-jurisdictie, `weur`.
- [D1 read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/) — Sessions API vereist.
- [D1-migraties](https://developers.cloudflare.com/d1/reference/migrations/) — `wrangler d1 migrations`.
- [D1 `batch()`](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) — meerdere statements, sequentieel en rollback bij fout.
- [Durable Objects-pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) — requests, duration, storage.
- [KV-werking](https://developers.cloudflare.com/kv/concepts/how-kv-works/) — eventual consistency.
- [KV-pricing](https://developers.cloudflare.com/kv/platform/pricing/) — reads/writes/storage.
- [R2-pricing](https://developers.cloudflare.com/r2/pricing/) — storage en operations.
- [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) — Postgres/MySQL vanaf Workers.
- [Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) — verwerkersovereenkomst.
- [Cloudflare subprocessors](https://www.cloudflare.com/gdpr/subprocessors/) — actuele lijst.

### Drizzle

- [Drizzle + Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1) — driver, schema, migraties.

### Privacy en kinderen

- [AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming) — leeftijd 16 in Nederland, ouderlijke toestemming, intrekking vanaf 12.
- [AP: AVG in het kort](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/de-avg-in-het-kort) — beginselen en dataminimalisatie.
- [AP: verantwoordingsplicht](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/verantwoordingsplicht) — register, DPIA, datalekregister, privacyverklaring.
- [AP: DPIA](https://www.autoriteitpersoonsgegevens.nl/themas/avg-privacy/praktisch-avg/data-protection-impact-assessment-dpia) — wanneer en hoe.
- [AP: privacyrechten](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/privacyrechten-avg/uw-privacyrechten-gebruiken) — inzage, correctie, verwijdering.
- [ICO: Age Appropriate Design Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) — 15 standaarden.
- [16 CFR 312.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.2) — definities, persistent identifiers.
- [16 CFR 312.5](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.5) — ouderlijke toestemming.
- [16 CFR 312.10](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.10) — bewaar- en verwijderverplichtingen.
- [GDPR (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2016/679/oj) — Verordening (EU) 2016/679.
- [UAVG](https://wetten.overheid.nl/BWBR0040940/latest) — Nederlandse uitvoeringswet.

### Alternatieven

- [Supabase-pricing](https://supabase.com/pricing) — free/Pro.
- [Supabase Auth-quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) — browser-client naar project-URL.
- [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting) — Postgres zelf beheren.
- [Supabase API-keys](https://supabase.com/docs/guides/getting-started/api-keys) — publishable versus secret keys.
- [Clerk-pricing](https://clerk.com/pricing) — Hobby/Pro.
- [Clerk React-quickstart](https://clerk.com/docs/react/getting-started/quickstart) — clientintegratie.
- [Auth.js](https://authjs.dev/) — in 2026 onderdeel van Better Auth.
- [Firebase-pricing](https://firebase.google.com/pricing) — Auth tot 50k MAU.
- [Firebase Auth](https://firebase.google.com/docs/auth) — Google-identiteit en SDK.
- [PocketBase](https://pocketbase.io/) — self-hosted backend in één binary.

### Deze repository

- [`AGENTS.md`](../../AGENTS.md) — harde regels, werkwijze, deployment.
- [ADR 0001](../adr/0001-publieke-statische-spellen-app.md) — statisch ontwerp en de eis van een nieuwe ADR voor accounts.
- [`apps/games/public/_headers`](../../apps/games/public/_headers) — huidige CSP.
- [`wrangler.jsonc`](../../wrangler.jsonc) — Worker met alleen static assets.
- [`package.json`](../../package.json) — scripts en kwaliteitsgate.
- [`.fallowrc.json`](../../.fallowrc.json) — FSD-boundaries.
- [`router.tsx`](../../apps/games/src/app/router.tsx) — TanStack Router-routes.
- [`use-sudoku-store.ts`](../../libs/features/sudoku-game/model/use-sudoku-store.ts) — Zustand-load bij module-init.
- [`sudoku`](../../libs/features/sudoku-game/model/storage.ts), [`memory`](../../libs/features/memory-game/model/storage.ts), [`math`](../../libs/features/math-trainer/model/storage.ts), [`pokemon-quiz`](../../libs/features/pokemon-quiz/model/storage.ts), [`word-search`](../../libs/features/word-search/model/storage.ts), [`arrows`](../../libs/features/arrow-game/model/storage.ts), [`seek`](../../libs/features/seek-and-find/model/storage.ts), [`sound`](../../libs/shared/lib/sound.ts) — localStorage-vormen.
