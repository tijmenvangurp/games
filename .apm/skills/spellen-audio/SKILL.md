---
name: spellen-audio
description: "Voeg spraakregels toe, controleer de audiocatalogus of repareer de speech-coverage in Spellen. Gebruik bij nieuwe voorleesteksten, een nieuwe audiogroep, een ontbrekend audiobestand of een falende audio:check."
---

# Spraak en audio

Lees `docs/design-system.md` (sectie Spraak), `docs/tooling.md` en ADR 0023.

## Regels

- Audio is lokaal en vooraf gegenereerd. Geen runtime-TTS en geen externe
  request tijdens het spelen.
- Elke game met spraak heeft een `model/audio.ts` met `speechGroups`. De
  generator ontdekt die zelf via de public API.
- De spelcatalogus verklaart per game hoe spraak werkt: `group`, `visual`,
  `pending` of `legacy`.
- Een `available`-game zonder geldige verklaring laat
  `tests/node/speech-coverage.test.ts` falen. Een audiogroep zonder game faalt
  ook.
- Bestanden staan onder `apps/games/public/audio/` met een versiepad. Een nieuwe
  stem of set krijgt een nieuwe versiemap.

## Controleren

```sh
corepack pnpm run audio:check
corepack pnpm exec vitest run speech-coverage
```

De check controleert de catalogus, het lockbestand en de MP3-bestanden zonder
TTS. `speech-coverage` controleert de koppeling met `gameCatalog`.

## Genereren

De publieke generator is `scripts/generate-audio.ts`:

```sh
corepack pnpm run audio:nl
corepack pnpm run audio:check
```

De private TTS-helper is **alleen voor de eigenaar**. Contributors hebben geen
toegang en mogen hem niet in de repo zetten. Vraag de eigenaar om nieuwe audio
te genereren en commit alleen de gegenereerde bestanden, het manifest en het
lockbestand.

## Grenzen

- Geen URL, token, hostname, tailnet-naam of `.env`-waarde in een bestand,
  commit, screenshot of chat.
- Geen audiobestand zonder licentie of bronvermelding.
- Geen `audioText` toevoegen zonder de uitgesproken tekst en de geschreven tekst
  apart te controleren.
- Merge nooit zelfstandig.
