# Spellen

Publieke, statische spelletjes-app voor kinderen. De app is een Nx-monorepo met een Vite/React-frontend en Feature-Sliced Design.

## Structuur

```text
apps/games/          Vite-app: index.html, public/, router, styles
libs/pages/*         schermen die lagen samenstellen
libs/widgets/*       samengestelde UI-blokken
libs/features/*      spellogica en UX per feature
libs/entities/*      domeinmodellen en pure regels
libs/shared/lib      herbruikbare helpers
libs/shared/ui       UI-primitives en iconen
tests/               gedeelde Vitest-suites
```

Elke slice is een eigen Nx-project met een `project.json`, `tsconfig.json` en een public API (`index.ts`). De app importeert via de aliassen `@app/...`, `@pages/...`, `@widgets/...`, `@features/...`, `@entities/...` en `@shared/...`.

## Commando's

```sh
corepack pnpm install
corepack pnpm dev              # nx run games:serve
corepack pnpm build            # output: apps/games/dist
corepack pnpm test:run         # Vitest zonder coverage
corepack pnpm test:coverage    # Vitest met coverage-drempel
corepack pnpm typecheck        # web- en node-config
corepack pnpm lint             # alle Nx-projecten
corepack pnpm fsd              # Steiger op libs en app
corepack pnpm elements         # element-SVG's eenmalig verversen
corepack pnpm quality          # volledige kwaliteitsgate
corepack pnpm graph            # Nx-projectgraaf
corepack pnpm affected         # gerichte checks voor de huidige branch
```

Nx gebruikt alleen een lokale cache (`.nx/`). Er is geen Nx Cloud en de app doet geen externe requests.

## Pokémon-assets

De memory en de quiz **Wie is deze Pokémon?** gebruiken de 151 Pokémon uit Generatie 1. Artwork en animated sprites staan lokaal in `apps/games/public/pokemon/`, zodat de app geen runtime-API of CDN nodig heeft. De geluiden komen uit de gesynthetiseerde `playSound`-set van de app. Herkomst, bronlinks en de auteursrechtelijke afweging staan in [ADR 0005](docs/adr/0005-pokemon-assets.md).

## Element-assets

**Mengelmoes** gebruikt lokale SVG's uit [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (Flat). Die vallen onder de MIT-licentie; de volledige tekst staat in [`LICENSES/fluent-emoji-MIT.txt`](LICENSES/fluent-emoji-MIT.txt). De bestanden staan in `apps/games/public/elements/` en worden niet tijdens het spelen bij een externe host opgehaald.

## Audio

Audio is lokaal en vooraf gegenereerd; de app doet tijdens het spelen geen TTS-aanroep. Frans gebruikt de Piper-stem Tom. Nederlands gebruikt de Piper-stem **Nathalie** (`nl_BE-nathalie-medium`, CC0) voor Letterpret en voor de gesproken uitleg in Schaakles, Schaakpuzzels, Rekenen en Woordzoeker. Zie [ADR 0017](docs/adr/0017-letterklanken-en-audio.md) en [ADR 0023](docs/adr/0023-voorlezen-met-tts.md).

## Deployment

De app draait als Cloudflare Worker met static assets (`wrangler.jsonc`, workernaam `games`). **Cloudflare Workers Builds** bouwt en deployt bij elke push naar `main`; er zijn geen GitHub-secrets of API-tokens nodig.

Eenmalig in Cloudflare instellen via **Workers & Pages → `games` → Settings → Build**:

| Instelling                    | Waarde                |
| ----------------------------- | --------------------- |
| Git-repository                | `tijmenvangurp/games` |
| Productiebranch               | `main`                |
| Root directory                | `/`                   |
| Build command                 | `pnpm run build`      |
| Deploy command                | `npx wrangler deploy` |
| Buildvariabele `NODE_VERSION` | `24`                  |
| Buildvariabele `PNPM_VERSION` | `12.9.1`              |

De workernaam in het dashboard moet exact `games` zijn, anders weigert de build. Na een geslaagde build staat de nieuwste versie op <https://games.tijmenvangurp.workers.dev/>.

GitHub Actions draait de Quality-gate; de deploy-workflow is verwijderd zodat er één deploypad is. `pnpm deploy` blijft beschikbaar voor een handmatige deploy vanaf een machine met Cloudflare-toegang.
