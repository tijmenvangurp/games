# Spellen

Publieke spelletjes-app voor kinderen. Sudoku in 4 × 4, 6 × 6 en 9 × 9 en het zoekspel "Waar is Wobbel?". Alles werkt op telefoon en tablet.

**Live:** <https://games.tijmenvangurp.workers.dev/> (verschijnt na de eerste deploy)

## Hoe het werkt

- Statische React-SPA: Vite, React 19, TypeScript, Tailwind CSS, TanStack Router en Zustand.
- Sudoku's en zoekscènes worden volledig in de browser gemaakt. Elke sudoku heeft precies één oplossing.
- Geen backend, accounts, analytics, tracking of externe requests.
- Voortgang en instellingen staan alleen in `localStorage` op het apparaat zelf.
- Strikte Content-Security-Policy, `noindex` en `nosniff` via `public/_headers`.

## Spellen

- **Sudoku** — 4 × 4, 6 × 6 en 9 × 9; cijfers of dieren; drie moeilijkheidsgraden.
- **Waar is Wobbel?** — zoek het ene monstertje met de ster tussen tientallen soortgenoten, in een tuin of onder water.
- **Memory** — gepland.

## Ontwikkelen

```bash
pnpm install    # Node.js 24 of nieuwer
pnpm dev        # http://127.0.0.1:5180
pnpm quality    # ts-only, format, typecheck, coverage, build, boundaries, fallow
pnpm quality:full
pnpm e2e        # Playwright; bouwt eerst met pnpm build
```

Andere scripts: `pnpm lint`, `pnpm format`, `pnpm fsd`, `pnpm icons`, `pnpm build`, `pnpm deploy`.

## Deployment

De app draait als Cloudflare Worker met static assets (`wrangler.jsonc`, workernaam `games`). Elke push naar `main` deployt via GitHub Actions.

Eenmalig instellen in de repository (Settings → Secrets and variables → Actions):

| Secret | Waarde |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API-token met **Workers Scripts: Edit** voor dit account |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account-ID |

Zonder deze secrets slaat de deploy-stap over en blijft de workflow groen. Tokens horen nooit in de repo, in een commit of in chat.

## Kwaliteit

Dezelfde gate als `homelab-control`:

- OXC: `oxlint` en `oxfmt`
- Gesplitste TypeScript-configuratie (`tsconfig.node.json`, `tsconfig.web.json`)
- Vitest met coverage-drempel van 80% op statements, branches, functies en regels
- Feature-Sliced Design via Steiger
- Fallow boundary-check en audit
- Playwright E2E, inclusief mobiel en tablet viewport
- GitHub Actions vastgezet op volledige commit-SHA's; Dependabot houdt de pins wekelijks bij
- Husky pre-commit (`pnpm quality`), pre-push (blokkeert `main`) en commitlint met verplichte scope

De pnpm-instelling `minimumReleaseAge` uit `homelab-control` is bij de start bewust niet actief: een verse lockfile kan anders geen actuele toolchain resolven. Zie `docs/adr/0002-kwaliteitsgate.md`.

## Structuur

```
src/
  app/         router, providers, globale styles
  pages/       home, sudoku, seek
  widgets/     page-header, game-menu
  features/    sudoku-game, seek-and-find (stores, setup, speelveld)
  entities/    sudoku (generator, solver), hidden-object (zoekscène), game (catalogus)
  shared/      ui (button, celebration-dialog, icons), lib (cn, random)
tests/
  node/        engines en spellogica
  web/         React-componenten en storage
e2e/           Playwright
docs/adr/      architectuur- en privacybeslissingen
```

## Privacy en veiligheid

Deze repository en de site zijn openbaar. Zet er daarom nooit in:

- tokens, `.env`-waarden of credentials;
- interne hostnames, tailnet-namen, IP-adressen of paden uit het homelab;
- namen, foto's of andere persoonsgegevens van gezinsleden.

Nieuwe spellen blijven statisch en lokaal. Zodra een idee een server, account, analytics of gedeelde scores nodig heeft, eerst een ADR toevoegen en de eigenaar laten beslissen.
