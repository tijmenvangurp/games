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
- Gebruik geen `NX_DAEMON=false`-prefix. Die valt buiten de permissieregel `corepack *` en levert onnodige permission checks op. Gebruik `corepack pnpm exec nx ...` met Nx-flags; zie `docs/tooling.md`.
- Forceer een verse build met `corepack pnpm exec nx run games:build --skipNxCache`, niet met `pnpm run build -- --skip-nx-cache` (die flag gaat naar Vite).
- Draai `fallow` en Nx-taken niet parallel: Fallow schrijft `.fallow/` en kan de Nx-daemon laten stoppen. Zie `docs/tooling.md`.
- Draai vóór commit of push: `pnpm run quality` (of `quality:full`). E2E is optioneel lokaal en verplicht in CI.
- Commit volgens Conventional Commits met verplichte scope: `app`, `pages`, `widgets`, `features`, `entities`, `shared`, `tests`, `quality`, `ci`, `tooling`, `docs`, `deps` of `infra`.
- Nooit direct naar `main` pushen. Maak een branch en open een pull request; zie **Mergen** hieronder.
- Pin GitHub Actions op een volledige 40-tekens commit-SHA met een versiecommentaar (bijvoorbeeld `# v7.1.0`). Gebruik nooit bewegende tags of branches.
- Na een wijziging aan het spel: test op mobiel (390 px) en tablet (1024 px). Behoud veilige marges (`env(safe-area-inset-*)`) en touch-targets van minimaal 44 px.
- Dokumenteer architectuur-, privacy- of deploymentbeslissingen in `docs/adr/`.

## Mergen

- **De agent merget nooit zelfstandig.** Een pull request blijft open tot de eigenaar expliciet zegt dat hij gemerged mag worden. Geldige signalen zijn de letterlijke tekst _"merge mag"_, een GitHub-review met **Approve**, of het label `merge`.
- **Groene CI is nodig, maar geen toestemming.** "De checks zijn groen" of "het is klaar" is géén mandaat om te mergen. Vraag altijd om bevestiging en wacht daarop.
- **Nooit direct naar `main` pushen.** Altijd via een branch en een pull request — ook voor een wijziging aan deze regel zelf.
- Laat een pull request liever open met een korte status ("klaar, wacht op jouw akkoord") dan hem zelf af te ronden.
- Na expliciete toestemming: squash-merge (zoals de bestaande historie) en verwijder de branch.
- Twijfel je of je toestemming hebt? Niet mergen en het vragen.

## Deployment

- Cloudflare Worker `games` met static assets uit `apps/games/dist` (`wrangler.jsonc`).
- **Cloudflare Workers Builds** bouwt en deployt bij een push naar `main`. Er zijn geen GitHub-deploysecrets of API-tokens nodig.
- Dashboardinstellingen: branch `main`, root `/`, build `pnpm run build`, deploy `npx wrangler deploy`, `NODE_VERSION=24`, `PNPM_VERSION=12.9.1`.
- De workernaam in het dashboard moet exact `games` zijn.
- `apps/games/public/_headers` bevat de CSP en `noindex`; verzwak die niet zonder ADR.
