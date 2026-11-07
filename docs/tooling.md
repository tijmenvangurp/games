# Tooling: Nx-daemon, cache en Fallow

Deze repository gebruikt Nx als lokale taakrunner. Er is geen Nx Cloud. Onderstaande afspraken voorkomen onnodige prompts, cacheverwarring en vastlopende daemons. Zie `docs/agents.md` voor de skills en MCP's die hierbij horen.

## Geen `NX_DAEMON=false` als commandoprefix

Gebruik geen commando's als:

```sh
NX_DAEMON=false corepack pnpm run build
```

Dat werkt technisch, maar de agent-permissieregel in `opencode.jsonc` matcht op `corepack *`. Door de prefix wordt de commando-resource anders en volgt een permission check. Hetzelfde geldt voor andere env-prefixen; daarvoor staan alleen de bewuste uitzonderingen in `opencode.jsonc`.

Gebruik in plaats daarvan gewoon:

```sh
corepack pnpm run build
corepack pnpm run typecheck
corepack pnpm run quality:full
```

Als de daemon echt moet worden gestopt of gereset:

```sh
corepack pnpm exec nx daemon --stop
corepack pnpm exec nx reset --onlyDaemon
```

## Nx-cache geforceerd omzeilen

`--skip-nx-cache` is een Nx-flag, geen Vite-flag. Bij deze scripts moet je Nx daarom direct aanroepen:

```sh
corepack pnpm exec nx run games:build --skipNxCache
corepack pnpm exec nx run-many -t lint,typecheck,test,build --skipNxCache
```

Dit is **fout**, omdat de flag dan aan Vite wordt doorgegeven:

```sh
corepack pnpm run build -- --skip-nx-cache
# -> vite build --skip-nx-cache
# -> Unknown option `--skipNxCache`
```

## Fallow en de Nx-daemon

`fallow audit` schrijft naar `.fallow/` in de workspace. Als Fallow tegelijk met een Nx-taak draait, kan de Nx-watcher zijn ignored-bestanden zien wijzigen en de daemon stoppen met:

```text
Stopping the daemon the set of ignored files changed (native)
```

Dat is een tooling-race, geen fout in de app. Draai `fallow` en Nx-taken daarom bij voorkeur **na elkaar**, niet parallel. Als de daemon toch stopt, is opnieuw draaien voldoende:

```sh
corepack pnpm run boundaries
corepack pnpm run fallow
corepack pnpm run build
```

`NX_DAEMON=false` is alleen een laatste redmiddel voor een bewuste parallelle run. Het is geen oplossing voor package-installatie en hoeft niet standaard gebruikt te worden. Voor dat laatste redmiddel staat een expliciete allow-regel in `opencode.jsonc`, zodat een bewuste keuze geen prompt oplevert.

## Elementiconen (Mengelmoes)

De iconen in `apps/games/public/elements/` worden gegenereerd uit lokale Iconify-pakketten. Er gaat geen netwerkrequest aan te pas: de sets staan als dev-dependency in `pnpm-lock.yaml`.

```sh
corepack pnpm run elements        # schrijf alle SVG's opnieuw
corepack pnpm run elements:check  # controleer zonder te schrijven (zit in quality)
```

De lijst met elementen en hun iconen staat in `scripts/element-icons.ts`. Een icoon is een Iconify-referentie (`set:name`) of een prioriteitslijst daarvan; de eerste match wint. Zo kan een element terugvallen op een andere set als Fluent Emoji geen passend beeld heeft.

Een set toevoegen:

```sh
corepack pnpm add -D @iconify-json/<prefix>
```

en daarna `<prefix>:<name>` in de lijst zetten. Monochrome sets (zoals Phosphor) gebruiken `currentColor`; geef zo'n element een `color` mee, anders wordt het icoon zwart in de `<img>`.

Een icoon dat echt niet bestaat, mag handmatig in dezelfde platte stijl in `apps/games/public/elements/` staan. Zet het element dan op `{ custom: true }`; de generator laat het bestand met rust en controleert alleen of het bestaat.

## Ganzenbordprenten

De popup bij een gebeurtenis toont de prent van dat vak uit `apps/games/public/ganzenbord/board.webp`. De uitsneden staan in `apps/games/public/ganzenbord/events/` en worden met `sharp` gemaakt:

```sh
corepack pnpm run ganzenbord:art        # snijd de prenten opnieuw
corepack pnpm run ganzenbord:art:check  # controleer zonder te schrijven (zit in quality)
```

De kaders en draaiingen staan in `scripts/build-ganzenbord-event-art.ts`, in procenten van het bord. Prenten boven de evenaar staan ondersteboven en draaien 180°; de brug draait 90°. Het script bewaart een manifest met de hash van het bord, zodat een gewijzigd bord of een handmatig aangepaste prent de quality-check laat falen.

## Playwright

Op sommige machines heeft de Playwright-browser extra libraries en fonts nodig.
Daarvoor staan de prefixen `LD_LIBRARY_PATH=* corepack *` en
`FONTCONFIG_PATH=* corepack *` expliciet toegestaan in `opencode.jsonc`. Op een
normale machine zijn die niet nodig; `scripts/run-playwright.ts` zet ze alleen
als de mappen bestaan. Gebruik bij voorkeur het bestaande script:

```sh
corepack pnpm run e2e
```

## Klankprototype voor TTS

`scripts/generate-sounds.ts` genereert tijdelijke MP3's voor losse klanken in `prototype/sounds/` (gitignored). De audio is een prototype: kies eerst de variant en stem, en zet pas daarna de gekozen bestanden in `apps/games/public/audio/letters/v2/sounds/`.

De TTS-helper met de endpoint en sleutel is **alleen voor de eigenaar**. Die
staat buiten de repo en wordt niet aan contributors gegeven. Vraag de eigenaar
om nieuwe audio te genereren; commit alleen de gegenereerde bestanden, het
manifest en het lockbestand. Zet endpoint, sleutel, hostname of `.env`-waarde
nooit in de repo, een screenshot of een prompt.

```sh
<private-helper> -- --generator=scripts/generate-sounds.ts \
  --only=i,k,m,s,p,v,e,n,t,a \
  --variant=letter,fonetisch,woord \
  --label=nathalie
```

Beluisteren zonder opnieuw te genereren:

```sh
corepack pnpm exec tsx scripts/generate-sounds.ts --serve-only
```

Open daarna `http://localhost:4174/`. De pagina toont per klank alle varianten en stemmen.

De definitieve set staat in `apps/games/public/audio/letters/v2/sounds/`; de keuzes en het manifest staan in `manifest.json` in dezelfde map. De 15 woordopnames staan in `apps/games/public/audio/letters/v2/words/` en zijn met dezelfde stem gegenereerd:

```sh
<private-helper> -- --generator=scripts/generate-sounds.ts --words \
  --model=speaches-ai/piper-nl_BE-nathalie-medium --voice=nathalie
```

De prototypepagina wordt niet gedeployed.

## Kort

| Doel                     | Commando                                              |
| ------------------------ | ----------------------------------------------------- |
| Normale build            | `corepack pnpm run build`                             |
| Verse build zonder cache | `corepack pnpm exec nx run games:build --skipNxCache` |
| Daemon stoppen           | `corepack pnpm exec nx daemon --stop`                 |
| Daemon resetten          | `corepack pnpm exec nx reset --onlyDaemon`            |
| Volledige kwaliteitsgate | `corepack pnpm run quality:full`                      |
| E2E                      | `corepack pnpm run e2e`                               |
