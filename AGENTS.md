# AGENTS.md — Spellen

Publieke, statische spelletjes-app voor kinderen. Lees `README.md` en de relevante `docs/adr/` voordat je iets verandert.

## Harde regels

- **Openbare repository en site.** Geen secrets, tokens, `.env`-waarden, interne hostnames, tailnet-namen, IP-adressen of persoonsgegevens in code, assets, commits of chat.
- **Alleen TypeScript.** Geen `.js`, `.mjs`, `.cjs`, `.jsx` of Python. `pnpm run ts-only` en de commit-hook bewaken dit.
- **Geen externe requests.** Geen analytics, CDN's, webfonts, trackers of remote images. Iconen komen uit `lucide-react` via `@shared/ui` of uit `public/`.
- **Geen backend toevoegen** zonder ADR en expliciete goedkeuring van de eigenaar. Spellen zijn client-side en lokaal.

## Architectuur

Feature-Sliced Design met dezelfde lagen als `homelab-control`:

- `src/app` — router, providers, globale styles
- `src/pages` — schermen die lagen samenstellen
- `src/widgets` — samengestelde UI-blokken
- `src/features` — spellogica/UX per feature, Zustand-stores in `model/`
- `src/entities` — domeinmodellen en pure regels (sudoku-generator, speler-state)
- `src/shared` — herbruikbare UI en helpers

Importeer alleen via de public API (`index.ts`) van een laag. Een laag mag alleen van lager gelegen lagen importeren. UI-primitives staan in `src/shared/ui`, helpers in `src/shared/lib`.

## Werkwijze

- Gebruik `corepack pnpm` voor alle commando's.
- Draai vóór commit of push: `pnpm run quality` (of `quality:full`). E2E is optioneel lokaal en verplicht in CI.
- Commit volgens Conventional Commits met verplichte scope: `app`, `pages`, `widgets`, `features`, `entities`, `shared`, `tests`, `quality`, `ci`, `tooling`, `docs`, `deps` of `infra`.
- Nooit direct naar `main` pushen. Maak een branch, open een pull request en merge pas als alle CI-checks groen zijn.
- Na een wijziging aan het spel: test op mobiel (390 px) en tablet (1024 px). Behoud veilige marges (`env(safe-area-inset-*)`) en touch-targets van minimaal 44 px.
- Dokumenteer architectuur-, privacy- of deploymentbeslissingen in `docs/adr/`.

## Deployment

- Cloudflare Worker `games` met static assets uit `dist/` (`wrangler.jsonc`).
- Deploy verloopt via GitHub Actions op `main` met `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID` als repository-secrets. Nooit tokens committen of in chat plakken.
- `public/_headers` bevat de CSP en `noindex`; verzwak die niet zonder ADR.
