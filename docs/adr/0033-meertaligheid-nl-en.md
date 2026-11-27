# ADR 0033: Meertaligheid met Nederlands als standaard en Engels als keuze

- **Status:** Proposed
- **Datum:** 2026-11-21
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0004](0004-nx-monorepo.md), [ADR 0023](0023-voorlezen-met-tts.md)

## Context

De app was alleen Nederlands: alle teksten stonden direct in de componenten,
modellen en generators. Er is gevraagd om een Engelse versie, met Nederlands als
standaard en een taalknop rechtsboven op het beginscherm.

Randvoorwaarden: geen netwerk tijdens gebruik, geen backend, alleen TypeScript,
FSD-grenzen en een bestaande testset die Nederlandse teksten controleert. De
voorleesstem bestaat uit vooraf opgenomen Nederlandse mp3's (ADR 0023).

De alternatieven:

- **Alleen i18next met JSON-bestanden per namespace.** Afgevallen voor de
  spelteksten: sleutels als losse strings zijn niet type-veilig per slice, en
  een centrale lijst in `shared` zou kennis van elk spel naar de onderste laag
  trekken.
- **Eigen vertaalcontext zonder library.** Afgevallen: taaldetectie, opslag,
  `<html lang>` en React-binding zijn opgeloste problemen (beleid
  _bibliotheken eerst_).
- **Browsertaal volgen.** Afgevallen: de vraag was expliciet dat Nederlands de
  standaard blijft.
- **Engelse spraak via de Web Speech API.** Afgevallen: sommige browsers sturen
  tekst naar een externe dienst, en de kwaliteit verschilt per apparaat.

## Beslissing

1. **`i18next`, `react-i18next` en `i18next-browser-languagedetector`** in
   `libs/shared/i18n` (`@shared/i18n`). Talen: `nl` (standaard en fallback) en
   `en`. De keuze staat in `localStorage` onder `games.language.v1`; de
   browsertaal telt niet mee. Bij elke wissel wordt `<html lang>` bijgewerkt.
2. **Gedeelde UI-teksten** (beginscherm, terugknop, geluid, voorlezen, nieuw
   spel, startknop, feestdialoog, bemoediging) staan als typed i18next-resources
   in `libs/shared/i18n/locales/`. `en.ts` moet dezelfde vorm hebben als `nl.ts`.
3. **Spelteksten blijven bij hun slice** via `defineTexts(nl, en)` met
   `useTexts` in React en `getTexts` in stores en generators. De Engelse kant
   moet dezelfde sleutels en functies hebben; TypeScript bewaakt dat.
4. **Spelnamen en categorieën** staan in `@entities/game`; de Engelse namen zijn
   een `Record<GameId, ...>`, zodat een nieuw spel zonder Engelse naam niet bouwt.
5. **De taalknop** (`LanguageSwitcher` in `@shared/ui`) staat rechtsboven op het
   beginscherm naast _Verras me!_.
6. **Voorlezen** speelt alleen in het Nederlands. In het Engels zwijgen
   `speak()` en `useAutoSpeech`, en verbergen de voorleesknoppen zich. De eigen
   Franse speler van _Bonjour !_ en de letterklanken van _Letterpret_ blijven
   werken, omdat die de leerstof zelf zijn.
7. **Leerinhoud** blijft in de doeltaal: Franse woorden in _Bonjour !_,
   Nederlandse letterklanken en woordjes in _Letterpret_. Uitleg en knoppen worden
   wel vertaald. Gegenereerde data met een `--check` wordt niet met de hand
   aangepast; Engels staat ernaast in een eigen map of wordt afgeleid, zoals
   landnamen via `Intl.DisplayNames`.

## Gevolgen

- **Privacy en CSP:** ongewijzigd. Alle teksten zitten in de bundel; er zijn
  geen runtime-requests. Alleen de taalkeuze komt in `localStorage`.
- **Bundel:** drie extra libraries en een Engelse kopie van de spelteksten.
- **Onderhoud:** een nieuwe tekst vraagt een Nederlandse en een Engelse versie.
  TypeScript faalt als de Engelse ontbreekt. Een nieuw spel vraagt een Engelse
  naam en beschrijving in `@entities/game`.
- **Tests:** bestaande tests blijven Nederlands, omdat dat de standaard is. Per
  groep spellen controleert een Engelse test de belangrijkste schermen.
- **Lopend spel:** taalgebonden inhoud wordt bij een taalwissel niet hergebruikt.
  Een lopende Woordzoeker, Typepret-ronde of Geheime Code-puzzel gaat terug naar
  de start, een opgeslagen Woordzoeker-puzzel uit een andere taal wordt niet
  hervat en Draaiwerk-feedback verdwijnt. Instellingen en voortgang blijven
  bewaard.
- **Spraak:** Engelse opnames ontbreken. Als die later komen, kan
  `hasRecordedSpeech()` per taal kijken en kan `audioSrc` de taal in het pad
  opnemen (`/audio/en/...`).

## Bronnen

- [i18next](https://www.i18next.com/) (MIT)
- [react-i18next](https://react.i18next.com/) (MIT)
- [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector) (MIT)
- [MDN: `Intl.DisplayNames`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames)
- [ADR 0023](0023-voorlezen-met-tts.md) — voorlezen met vooraf opgenomen spraak.

## Checklist

- [x] Titel, status en datum kloppen.
- [x] Context noemt de alternatieven.
- [x] Beslissing is concreet en toetsbaar.
- [x] Gevolgen noemen privacy, CSP, assets en tests waar relevant.
- [x] Bronnen en licenties zijn compleet.
- [x] `docs/README.md` en `docs/adr/README.md` zijn bijgewerkt.
