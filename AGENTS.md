# AGENTS.md — Spellen

Publieke, statische spelletjes-app voor kinderen. Lees `README.md` en de relevante `docs/adr/` voordat je iets verandert.

## Harde regels

- **Openbare repository en site.** Geen secrets, tokens, `.env`-waarden, interne hostnames, tailnet-namen, IP-adressen of persoonsgegevens in code, assets, commits of chat.
- **Alleen TypeScript.** Geen `.js`, `.mjs`, `.cjs`, `.jsx` of Python. `pnpm run ts-only` en de commit-hook bewaken dit.
- **Geen `!important` in CSS.** Gebruik cascade layers (`@layer`) of een specifiekere selector; de fallow-regel `css-selector-complexity` (op `error`) bewaakt dit, net als id-selectors en diepe nesting.
- **Geen externe requests.** Geen analytics, CDN's, webfonts, trackers of remote images. Iconen komen uit `lucide-react` via `@shared/ui` of uit `apps/games/public/`.
- **Geen backend toevoegen** zonder ADR en expliciete goedkeuring van de eigenaar. Spellen zijn client-side en lokaal.

## Architectuur

Nx monorepo met Feature-Sliced Design. Elke slice is een eigen Nx-project:

- `apps/games` — Vite-app: `index.html`, `public/`, router, providers en globale styles
- `libs/pages/*` — schermen die lagen samenstellen
- `libs/widgets/*` — samengestelde UI-blokken
- `libs/features/*` — spellogica/UX per feature, Zustand-stores in `model/`
- `libs/entities/*` — domeinmodellen en pure regels (sudoku-generator, speler-state)
- `libs/shared/lib` — herbruikbare helpers
- `libs/shared/ui` — UI-primitives en iconen
- `tests/` — gedeelde Vitest-suites voor de kwaliteitsgate

Elke lib heeft een `project.json`, een `tsconfig.json` en een public API (`index.ts`). Importeer alleen via die public API en via de aliassen (`@pages/...`, `@features/...`, `@entities/...`, `@shared/...`, `@app/...`). Een laag mag alleen van lager gelegen lagen importeren. Nx-tags (`layer:*`, `scope:*`, `type:*`) documenteren dezelfde grens; Steiger en Fallow bewaken hem.

De app wordt gebouwd met Vite vanuit `apps/games`; de output staat in `apps/games/dist`.

## Werkwijze

- Gebruik `corepack pnpm` voor alle commando's. Nx-taken staan in `project.json`; gebruik `pnpm run graph` voor de projectgraaf en `pnpm run affected` voor gerichte checks.
- `pnpm run build`, `pnpm run typecheck`, `pnpm run test:coverage` en `pnpm run lint` draaien via Nx en profiteren van de lokale cache. Geen Nx Cloud: de app en CI sturen niets naar externe diensten.
- Draai vóór commit of push: `pnpm run quality` (of `quality:full`). E2E is optioneel lokaal en verplicht in CI.
- Commit volgens Conventional Commits met verplichte scope: `app`, `pages`, `widgets`, `features`, `entities`, `shared`, `tests`, `quality`, `ci`, `tooling`, `docs`, `deps` of `infra`.
- Nooit direct naar `main` pushen. Maak een branch, open een pull request en merge pas als alle CI-checks groen zijn.
- Pin GitHub Actions op een volledige 40-tekens commit-SHA met een versiecommentaar (bijvoorbeeld `# v7.1.0`). Gebruik nooit bewegende tags of branches.
- Na een wijziging aan het spel: test op mobiel (390 px) en tablet (1024 px). Behoud veilige marges (`env(safe-area-inset-*)`) en touch-targets van minimaal 44 px.
- Dokumenteer architectuur-, privacy- of deploymentbeslissingen in `docs/adr/`.

## Deployment

- Cloudflare Worker `games` met static assets uit `apps/games/dist` (`wrangler.jsonc`).
- **Cloudflare Workers Builds** bouwt en deployt bij een push naar `main`. Er zijn geen GitHub-deploysecrets of API-tokens nodig.
- Dashboardinstellingen: branch `main`, root `/`, build `pnpm run build`, deploy `npx wrangler deploy`, `NODE_VERSION=24`, `PNPM_VERSION=12.9.1`.
- De workernaam in het dashboard moet exact `games` zijn.
- `apps/games/public/_headers` bevat de CSP en `noindex`; verzwak die niet zonder ADR.
