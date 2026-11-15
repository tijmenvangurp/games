---
name: spellen-quality
description: "Draai en repareer de kwaliteitsgate van Spellen. Gebruik bij quality-fouten, een trage of vastgelopen Nx-daemon, Fallow-botsingen, Playwright-problemen of een pull request die CI niet haalt."
---

# Kwaliteitsgate

Lees `docs/tooling.md` voordat je iets forceert.

## Commando's

```sh
corepack pnpm run quality        # commit-hook en snelle lokale controle
corepack pnpm run quality:full   # quality + lint + Steiger; lokaal vóór een PR
corepack pnpm run quality:ci     # quality:full + e2e; hetzelfde als CI
```

Gebruik altijd `corepack pnpm`, niet `pnpm` of `npx` door elkaar.

## Veelvoorkomende fouten

- **Nx-daemon stopt na Fallow.** Fallow schrijft `.fallow/` en de Nx-watcher
  ziet dat als een wijziging. Draai Fallow en Nx niet parallel. Herstart met
  `corepack pnpm exec nx daemon --stop` of
  `corepack pnpm exec nx reset --onlyDaemon`.
- **Build komt uit cache terwijl je een verse wilt.** Gebruik
  `corepack pnpm exec nx run games:build --skipNxCache`. Geef
  `--skip-nx-cache` niet aan `pnpm run build`; die flag gaat naar Vite.
- **Playwright start niet.** Draai eerst `corepack pnpm run build`; de preview
  served `apps/games/dist/`. Gebruik `corepack pnpm run e2e`, dat de lokale
  browserbibliotheken en fonts zet als ze bestaan.
- **TypeScript-only faalt.** Er is een `.js`, `.mjs`, `.cjs`, `.jsx` of `.py`
  bestand bijgekomen. Herstel het naar `.ts`/`.tsx`; voeg geen uitzondering toe.
- **Coverage zakt.** Voeg een gerichte test toe in `tests/node` of
  `tests/web`; verlaag de drempel niet.
- **Steiger of Fallow klaagt over een grens.** Verplaats code naar de juiste
  laag of werk de public API bij; onderdruk de regel niet zonder ADR.

## Werkwijze

1. Lees de eerste fout, niet alleen de laatste regel.
2. Repareer de oorzaak; verlaag geen drempel en verwijder geen test.
3. Draai daarna `quality:full` opnieuw.
4. Meld in de pull request wat je hebt gerepareerd en welk commando groen is.

## Grenzen

- Geen `NX_DAEMON=false` als standaardprefix; alleen als laatste redmiddel.
- Geen brede permission-regel toevoegen om een prompt te omzeilen.
- Geen `.js`-config of test toevoegen.
- Merge nooit zelfstandig.
