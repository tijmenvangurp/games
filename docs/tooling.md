# Tooling: Nx-daemon, cache en Fallow

Deze repository gebruikt Nx als lokale taakrunner. Er is geen Nx Cloud. Onderstaande afspraken voorkomen onnodige prompts, cacheverwarring en vastlopende daemons.

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

## Playwright

De Playwright-browser heeft in deze omgeving extra libraries en fonts nodig. Daarvoor staan de prefixen `LD_LIBRARY_PATH=* corepack *` en `FONTCONFIG_PATH=* corepack *` expliciet toegestaan in `opencode.jsonc`. Gebruik bij voorkeur het bestaande script:

```sh
corepack pnpm run e2e
```

## Klankprototype voor TTS

`scripts/generate-sounds.ts` genereert tijdelijke MP3's voor losse klanken in `prototype/sounds/` (gitignored). De audio is een prototype: kies eerst de variant en stem, en zet pas daarna de gekozen bestanden in `apps/games/public/audio/letters/v2/sounds/`.

Gebruik de private TTS-helper uit de skill `generate-game-audio`; die vult de endpoint en sleutel in. Zet die waarden nooit in de repo.

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
