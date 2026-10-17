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
- Pin GitHub Actions op een volledige 40-tekens commit-SHA met een versiecommentaar (bijvoorbeeld `# v7.1.0`). Gebruik nooit bewegende tags of branches.
- Na een wijziging aan het spel: test op mobiel (390 px) en tablet (1024 px). Behoud veilige marges (`env(safe-area-inset-*)`) en touch-targets van minimaal 44 px.
- Dokumenteer architectuur-, privacy- of deploymentbeslissingen in `docs/adr/`.

## Deployment

- Cloudflare Worker `games` met static assets uit `dist/` (`wrangler.jsonc`).
- **Cloudflare Workers Builds** bouwt en deployt bij een push naar `main`. Er zijn geen GitHub-deploysecrets of API-tokens nodig.
- Dashboardinstellingen: branch `main`, root `/`, build `pnpm run build`, deploy `npx wrangler deploy`, `NODE_VERSION=24`, `PNPM_VERSION=12.9.1`.
- De workernaam in het dashboard moet exact `games` zijn.
- `public/_headers` bevat de CSP en `noindex`; verzwak die niet zonder ADR.
