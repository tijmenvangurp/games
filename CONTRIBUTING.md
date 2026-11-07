# Bijdragen aan Spellen

Spellen is een publieke, statische spelletjes-app voor kinderen. De app draait
zonder backend, zonder analytics en zonder externe requests tijdens het spelen.
Lees eerst `README.md`, `AGENTS.md` en de relevante ADR's in `docs/adr/`.

## Wat je nodig hebt

- Node.js 24 (zie `.nvmrc`)
- Corepack; gebruik daarna `corepack pnpm` voor elk commando
- Git en een GitHub-account

```sh
corepack enable
corepack pnpm install
corepack pnpm run harness:install   # skills + MCP's voor Claude/Codex
corepack pnpm dev
```

## Agent-harness

De gedeelde skills en MCP's staan in de repo; je hebt ze niet nodig om te
kunnen bijdragen.

- **Skills:** APM leest `apm.yml` en `apm.lock.yaml`. Projectskills staan in
  `.apm/skills/`; APM deployt ze naar `.agents/skills/` (OpenCode en Codex) en
  `.claude/skills/` (Claude Code).
- **MCP's:** Claude Code leest `.mcp.json`, Codex leest `.codex/config.toml`.
  OpenCode leest `opencode.jsonc`; die blijft handmatig tot APM OpenCode V2
  ondersteunt.
- **Firecrawl:** remote MCP met OAuth. De gratis tier geeft 1.000 credits per
  maand; meld je via `/mcps` aan. Een API-key kan ook, maar staat nooit in de
  repo.
- **Bijwerken:** `apm update --yes && corepack pnpm run harness:install`.
- **Geheimen:** houd tokens, `.env`-waarden en persoonsgegevens buiten de repo
  en buiten een prompt.

## Werkwijze

1. Maak een branch vanaf `main`. Push nooit direct naar `main`.
2. Houd de wijziging klein en gericht. Eén spel, één fix of één document per
   pull request.
3. Schrijf tests bij nieuwe regels of gedrag. Zie `README.md` en de scripts in `package.json`.
4. Draai vóór je commit:

   ```sh
   corepack pnpm run quality:full
   ```

5. Test op mobiel (390 px) en tablet (1024 px). Touch-targets zijn minimaal
   44 px en respecteren `env(safe-area-inset-*)`.
6. Open een pull request met de template. Groene CI is nodig, maar **geen**
   toestemming om te mergen. De maintainer geeft expliciet akkoord; zie
   `AGENTS.md` → **Mergen**.

## Commits

Conventional Commits met een verplichte scope:

```text
feat(features): voeg een nieuwe hintregel toe
fix(pages): voorkom horizontale overflow op 390 px
docs(docs): leg de audiocatalogus uit
deps(deps): voeg een generator-bibliotheek toe
```

Toegestane scopes: `app`, `pages`, `widgets`, `features`, `entities`, `shared`,
`tests`, `quality`, `ci`, `tooling`, `docs`, `deps`, `infra`.

## Waar hoort code?

De repo gebruikt Nx en Feature-Sliced Design. Elke slice is een eigen
Nx-project met een `project.json`, `tsconfig.json` en `index.ts`.

| Laag              | Wat er hoort                                              |
| ----------------- | --------------------------------------------------------- |
| `libs/entities`   | Pure domeinregels en data, zonder React.                  |
| `libs/features`   | Spelstate (Zustand) en de UX van één feature.             |
| `libs/widgets`    | Samengestelde UI-blokken die meerdere features gebruiken. |
| `libs/pages`      | Schermen die lagen samenstellen.                          |
| `libs/shared/ui`  | UI-primitives en iconen.                                  |
| `libs/shared/lib` | Herbruikbare helpers zonder UI.                           |
| `apps/games`      | Router, providers, globale styles en `public/`.           |

Een laag mag alleen van lager gelegen lagen importeren. Importeer via de
public API en de aliassen (`@app`, `@pages`, `@widgets`, `@features`,
`@entities`, `@shared`). Steiger en Fallow bewaken de grens.

## Nieuwe spellen

Volg de stappen in `AGENTS.md` en de relevante ADR's. Een nieuw spel raakt
bijna altijd meerdere lagen, de catalogus, een icoon, een thumbnail, spraak en
tests. Leg een nieuwe mechanic of een nieuwe assetbron vast in een ADR.

## UI en content

- Volg `docs/design-system.md`.
- Geen `!important` in CSS; gebruik cascade layers of een specifiekere selector.
- Gebruik bestaande componenten (`GameShell`, `game-panel`, `Button`,
  `ChoiceCard`) voordat je iets nieuws maakt.
- Teksten zijn Nederlands, kort en kindgericht. Vermijd Engels in de UI.
- Voeg geen externe fonts, CDN's, trackers of remote images toe.

## Bibliotheken

Zoek eerst of een bestaande bibliotheek het probleem oplost. Een nieuwe
bibliotheek toevoegen mag, maar moet binnen de CSP werken en mag geen
telemetrie, account of netwerkverbinding nodig hebben. Zet de keuze in de
pull request en werk de tabel in `AGENTS.md` bij.

## Geheimen en privacy

- Geen tokens, `.env`-waarden, interne hostnames, netwerknamen, IP-adressen of
  persoonsgegevens in code, assets, commits, screenshots of chat.
- Geen analytics, trackers of externe requests toevoegen.
- De app is voor kinderen: verzamel zo weinig data als mogelijk en leg een
  nieuwe privacybeslissing vast in een ADR.

## Hulp nodig?

- Architectuur: `AGENTS.md` en `docs/adr/`.
- Tests: `README.md` en de scripts in `package.json`.
- Tooling en Nx: `docs/tooling.md`.
- Issues en specs: `docs/agents/issue-tracker.md`.
- Iets stuk? Open een issue met route, toestel, browser en een screenshot.
