# ADR 0012: Optionele accounts en gesynchroniseerde voortgang per profiel

- **Status:** Proposed — ter goedkeuring door de eigenaar
- **Datum:** 2026-10-18
- **Gerelateerd:** [ADR 0001](0001-publieke-statische-spellen-app.md) (statische app), [ADR 0013](0013-privacy-optionele-accounts.md) (privacy), [onderzoek](../research/2026-10-18-auth-backend-betterauth.md)

## Context

De app is vandaag volledig statisch. Elk spel bewaart zijn eigen voortgang in `localStorage` onder een versiekey (`games.sudoku.v1`, `games.math.v1`, enzovoort). Er zijn geen accounts, profielen, servers of externe requests. [ADR 0001](0001-publieke-statische-spellen-app.md) zegt dat accounts, gedeelde scores en multiplayer een nieuwe ADR met een expliciet privacy- en beveiligingsontwerp vereisen.

De eigenaar wil nu:

- **Zonder login blijven spelen.** Alle spellen moeten volledig werken zonder account, zonder loginmuur en zonder ingekorte functionaliteit.
- **Met login voortgang per persoon.** Na inloggen krijgt elke persoon een eigen state en kan de voortgang op meerdere toestellen beschikbaar komen.
- **Eén ouderlogin met interne kindprofielen.** De ouder logt in en maakt daaronder kindprofielen aan, zoals profiel switchen bij Netflix. Het kind krijgt geen eigen account of e-mailadres.
- **Account start leeg.** Bij de eerste login wordt lokale voortgang niet automatisch overgezet. De lokale voortgang blijft op het toestel staan.

"Tracking" betekent in dit verband **voortgang en state per profiel**, niet gedragsanalytics. Er komen geen trackers, advertenties of profiling.

Het technische onderzoek staat in [research/2026-10-18-auth-backend-betterauth.md](../research/2026-10-18-auth-backend-betterauth.md). Daaruit volgt dat Better Auth in dezelfde Cloudflare Worker met D1 de kleinste toevoeging is die aan deze eisen voldoet.

## Beslissing

1. **Gast-eerst is een harde invariant.** Geen enkele game, instelling of lokale profielkeuze mag afhankelijk zijn van een sessie of netwerk. De app rendert altijd eerst lokale state en probeert daarna pas te synchroniseren. Een login voegt sync toe; hij haalt niets weg.
2. **Eén ouderaccount per gezin.** De ouder of verzorger is de enige die inlogt. Het account is van de ouder, niet van het kind. Er is geen kindlogin, geen kind-e-mailadres en geen social login voor kinderen.
3. **Kindprofielen zijn rijen, geen accounts.** Onder het ouderaccount staan profielen (voorstel: maximaal vier). Een profiel heeft een slot, een avatar uit een vaste lokale set en een `id`. Een naam is optioneel en blijft lokaal; de server slaat geen naam, e-mail, geboortedatum, foto of locatie van het kind op.
4. **Profiel switchen zoals Netflix.** De app toont een profielkeuze zodra een ouder is ingelogd. Het actieve profiel bepaalt welke state de games lezen en schrijven. Wisselen gebeurt zonder opnieuw in te loggen.
5. **Twee gescheiden namespaces.** Gastmodus gebruikt `local:<slot>` (de bestaande `games.<spel>.v1`-keys gelden als slot 1); ingelogd gebruikt `account:<player_id>`. Bij inloggen wordt de lokale state **niet** verwijderd of geüpload. Het account begint leeg. Na uitloggen is de lokale state weer beschikbaar. Zo gaat er geen voortgang verloren en is er geen stille merge.
6. **Geen automatische merge in versie 1.** De eigenaar heeft gekozen voor "account start leeg". Een latere "neem lokale voortgang mee"-actie is een aparte feature met eigen merge-regels en een eigen ADR. De UI meldt bij de eerste login duidelijk: "Je account begint leeg; je lokale voortgang blijft op dit toestel."
7. **Sync-scope.** In versie 1 synchroniseren we alleen instellingen, beste scores en grove voortgang (bijvoorbeeld `unlocked` en sterren). Geen actieve sudoku-borden, woordzoeker-grids, `selected`-velden of SRS-state. Die zijn groot, apparaatgebonden en conflictgevoelig.
8. **Zelfde origin, zelfde Worker.** De auth- en progress-API draaien in de bestaande Cloudflare Worker onder `/api/auth/*` en `/api/progress/*`, naast de static assets. Geen aparte API-subdomein en geen CORS.
9. **Better Auth en D1.** We gebruiken Better Auth 1.7.x (exact gepind) met de ingebouwde D1-ondersteuning en een D1-database in de `eu`-jurisdictie. De tabellen `user`, `session`, `account` en `verification` zijn van Better Auth; `player`, `progress`, `progress_mutation` en `consent` zijn van ons.
10. **State-model.** Eén `progress`-rij per `player_id` + `game_id` met een JSON-envelop (`schema_version`, `revision`, `data_json`, `client_updated_at`, `server_updated_at`). Schrijven gebeurt met een idempotente upsert plus een `progress_mutation`-insert in dezelfde D1-batch. De client houdt een outbox bij en probeert opnieuw met backoff.
11. **Conflictregels.** Instellingen: last-write-wins op `client_updated_at`. Beste scores en `unlocked`: `max(existing, incoming)`. Er is geen server-authoritative anti-cheat; de client berekent de score en dat is voor een familie-app acceptabel.
12. **Loginmethoden: passkey en social OAuth.** De ouder kan met een **passkey** inloggen en/of met **Google** via een gewone "Inloggen met Google"-knop. Beide methoden kunnen aan hetzelfde ouderaccount worden gekoppeld. Google OAuth is een **expliciete uitzondering** op de regel "geen externe requests": de browser navigeert naar Google en de Worker wisselt de code server-side in. Google is daarmee een verwerker; de voorwaarden staan in [ADR 0013](0013-privacy-optionele-accounts.md). Later kunnen meer OAuth-providers, bijvoorbeeld GitHub, als extra knop worden toegevoegd. E-mail met wachtwoord is geen fase-1-methode.
13. **Geen remote avatars.** Ook bij Google OAuth renderen we geen Google-avatar-URL. Het profiel gebruikt een avatar uit de lokale set. Dat voorkomt een `img-src`-uitzondering en een externe request.
14. **Feature-flag en uitrol.** `ACCOUNTS_ENABLED` (Worker-variabele) en `VITE_ACCOUNTS_ENABLED` (build-time, publiek) staan standaard uit. Previews krijgen geen auth. Uitrol: Worker deployen met de flag uit, testen met het ouderaccount van de eigenaar, daarna de flag aan en pas dan de accountroute zichtbaar maken.
15. **Verwijderen.** De ouder kan een kindprofiel verwijderen (cascade naar `progress`) en het hele account verwijderen (cascade naar `player`, `progress`, `progress_mutation`, `consent`, sessies en Better Auth-user). Lokale state blijft daarna staan. De verwijderactie vraagt een verse sessie of extra bevestiging.
16. **Geen publieke profielen, ranglijsten, chat of vriendenlijsten.** Dat zijn aparte producten met een eigen privacy- en veiligheidsontwerp. Ze vallen buiten deze ADR.

## API en datamodel

| Onderdeel    | Route of tabel      | Toelichting                                                                                                               |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Auth         | `/api/auth/*`       | `auth.handler(request)`; same-origin                                                                                      |
| Profielen    | `/api/players`      | Lijst, aanmaken, hernoemen (lokaal), verwijderen                                                                          |
| Voortgang    | `/api/progress`     | Ophalen en idempotent wegschrijven per `player_id` + `game_id`                                                            |
| Sessie       | `session`           | Better Auth; 7 dagen, `updateAge` 1 dag, intrekbaar                                                                       |
| Profiel      | `player`            | `id`, `owner_user_id`, `slot`, `avatar`, `created_at`, `deleted_at`                                                       |
| Voortgang    | `progress`          | `player_id`, `game_id`, `schema_version`, `revision`, `data_json`, `client_updated_at`, `server_updated_at`, `deleted_at` |
| Idempotentie | `progress_mutation` | `idempotency_key` (PK), `player_id`, `game_id`, `applied_revision`, `created_at`                                          |
| Toestemming  | `consent`           | `owner_user_id`, `policy_version`, `granted_at`, `withdrawn_at`, `method`                                                 |
| Rate limit   | `rateLimit`         | Alleen als `rateLimit.storage = "database"`                                                                               |

De server begrijpt alleen de envelop, niet de inhoud van `data_json`. Elk spel levert een pure migratie- en mergefunctie in de entity-laag. Zo kan een spel zijn formaat wijzigen zonder de auth-tabellen aan te raken.

## Configuratie en beveiliging

| Onderdeel  | Keuze                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Worker     | `main` + `assets.run_worker_first: ["/api/*"]`; rest blijft static assets                                |
| CSP        | `connect-src 'self'`; `form-action 'none'`; API-responses krijgen eigen `no-store`- en `nosniff`-headers |
| Secret     | `BETTER_AUTH_SECRET` als Workers-secret, 32+ tekens, rotatie via `BETTER_AUTH_SECRETS`                   |
| Base URL   | `BETTER_AUTH_URL` = publieke origin; previews niet vertrouwen                                            |
| Cookies    | `HttpOnly`, `Secure`, `SameSite=Lax`; geen cookie-cache in versie 1                                      |
| CSRF       | Origin- en Fetch Metadata-validatie van Better Auth; niet uitzetten                                      |
| Rate limit | Database-opslag; `cf-connecting-ip` als IP-header                                                        |
| Telemetrie | Expliciet uit                                                                                            |
| Migraties  | `wrangler d1 migrations apply` vóór de deploy; niet bij de eerste request                                |
| Logging    | Geen e-mail, tokens, cookies, IP of request-body in applicatielogs                                       |

## Gevolgen

- **De app blijft bruikbaar zonder account.** Dat is de belangrijkste eigenschap en moet in e2e-tests worden afgedwongen: alle spellen spelen zonder sessie, ook als de API onbereikbaar is.
- **De deployment wordt zwaarder.** Naast static assets komen een Worker-entry, een D1-binding, migraties, secrets en een Workers-plan. Het gratis plan kan waarschijnlijk volstaan; betaald (US$ 5/maand) is alleen nodig als de CPU-meting boven 10 ms uitkomt. De eenvoud van een pure statische site verdwijnt.
- **De CSP wordt verzwakt.** `connect-src 'none'` wordt `'self'`. Dat is een bewuste wijziging en moet in de headers en in de ADR zichtbaar blijven.
- **De publieke repo blijft schoon.** Geen secrets, `.dev.vars`, productie-exports of echte gezinsdata. Testdata gebruikt `example.invalid`.
- **Account en lokaal kunnen uit elkaar lopen.** Omdat het account leeg begint, kan een gebruiker twee soorten voortgang hebben. Dat is geaccepteerd voor versie 1; de UI moet het uitleggen.
- **Google OAuth is een bewuste uitzondering.** De Google-knop voegt een externe redirect, een derde partij en een verwerker toe. Dat is expliciet geaccepteerd; [ADR 0013](0013-privacy-optionele-accounts.md) legt de DPA, het register en de privacyverklaring vast. Er komen geen remote avatars of extra third-party requests bij.
- **Geen schermtijdbeleid.** Dagbudgetten, blokkades en ouderpincodes vallen buiten deze ADR. OS-ouderscontrole (Digital Wellbeing, Family Link) is daar de juiste plek. Een ouderoverzicht met bestede tijd zonder limiet kan later als dashboardfeature worden toegevoegd.
- **Latere fases.** Een ouder-dashboard, volledige SRS-sync en multiplayer vragen eigen ADR's. Deze ADR reserveert daar geen architectuur voor.

## Alternatieven

| Alternatief                             | Waarom niet                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Geen accounts, alleen lokale profielen  | Lost "per persoon op meerdere toestellen" niet op; blijft de fallback voor gasten   |
| Hosted auth (Supabase, Clerk, Firebase) | Externe requests, vendor-relatie en meer data bij een derde partij                  |
| Eigen sessie-cookie zonder Better Auth  | Meer eigen beveiligingsrisico: hashing, CSRF, rotatie, rate limiting                |
| Eén account per kind                    | Meer persoonsgegevens, ouderlijke toestemming en herstelwerk per kind               |
| Automatische merge bij eerste login     | Door de eigenaar afgewezen; geeft onvoorspelbaar gedrag en verlies van lokale state |
| Actieve borden en SRS ook syncen        | Conflictgevoelig en groot; geen duidelijke winst in versie 1                        |

## Open vragen

1. **Latere OAuth-providers:** welke providers komen na Google, bijvoorbeeld GitHub, en in welke volgorde?
2. **Maximum aantal profielen:** vier is een voorstel; wat is praktisch voor de doelgroep?
3. **Naam van een profiel:** volledig lokaal houden, of als optioneel veld toch syncen? Deze ADR kiest lokaal.
4. **Import van lokale voortgang:** komt er later een expliciete "neem mijn lokale voortgang mee"-actie? Zo ja, welke merge-regels?
5. **Ouder-dashboard:** mag de ouder de voortgang per profiel zien, en vanaf welke leeftijd?
6. **Preview-omgeving:** auth volledig uit, of een wegwerp-D1 met een aparte secret?
7. **Gebruiksduur:** wil je later een ouderoverzicht met bestede tijd per profiel, zonder limiet of blokkade?

## Status en vervolg

Deze ADR is **Proposed**. Zonder goedkeuring van de eigenaar en zonder [ADR 0013](0013-privacy-optionele-accounts.md) komt er geen productie-auth. Na goedkeuring: ADR's accepteren, D1 en Worker inrichten, migraties toevoegen en fase 1 achter de feature-flag uitrollen.
