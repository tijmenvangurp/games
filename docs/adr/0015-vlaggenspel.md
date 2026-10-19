# ADR 0015: Vlaggenspel met lokale vlaggen en landennamen

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0003](0003-originele-spelassets.md)

## Context

`docs/ideas/spelideeen.md` noemt wereldoriëntatie als gat in het aanbod: de app heeft rekenen, taal, puzzelen en schaken, maar niets waarbij je landen of de wereld leert. Het onderzoek in `docs/research/2026-10-18-opensource-webgames.md` wees daarvoor als eerste stap een vlaggenspel aan: de vlaggen, de continentindeling en de landennamen zijn alle drie vrij beschikbaar, dus er is geen tekenwerk en geen API nodig.

Dezelfde randvoorwaarden als bij de andere spellen gelden hier:

- De app is statisch en mag tijdens het spelen **niets** bij een derde partij ophalen; `apps/games/public/_headers` heeft een strikte CSP met `img-src 'self' data:` en `connect-src 'none'`.
- De repo is openbaar en bevat geen secrets of persoonsgegevens.
- Alleen TypeScript, geen backend, geen runtime-packages die data ophalen.
- Mobiel eerst: vlaggen moeten op 390 px leesbaar zijn en knoppen moeten minimaal 44 px zijn.

Vlaggen zijn vrijwel allemaal publiek domein, maar de keuze van de bestanden, de continentindeling en de Nederlandse namen zijn dat niet automatisch. Deze ADR legt vast waar elk onderdeel vandaan komt.

## Beslissing

1. **Eén spel, twee richtingen.** Vlaggenreis stelt per ronde tien vragen. De helft toont een vlag met de vraag welk land erbij hoort, de helft toont een landennaam met de vraag welke vlag erbij hoort. De richtingen wisselen elkaar in willekeurige volgorde af; er is geen aparte spellingsmodus.
2. **Per continent of de hele wereld.** De speler kiest Europa, Azië, Afrika, Noord-Amerika, Zuid-Amerika, Oceanië of de hele wereld. Binnen een ronde komt elk land maximaal één keer langs en blijven de afleiders binnen het gekozen gebied.
3. **Drie niveaus.** Makkelijk geeft 3 keuzes uit een ander continent, gemiddeld 4 keuzes uit hetzelfde continent en moeilijk 4 keuzes uit hetzelfde continent, waarbij vlaggen die op elkaar lijken (`libs/entities/flag/model/config.ts`) voorgaan.
4. **De vlaggen staan lokaal** in `apps/games/public/flags/<code>.svg` met de ISO 3166-1 alpha-2-code in kleine letters als bestandsnaam. De app bouwt zelf het pad (`/flags/nl.svg`); er gaat geen request naar buiten.
5. **De landenlijst is offline data.** `libs/entities/flag/model/countries.ts` bevat 197 landen met code, Nederlandse naam en continent. Geen package en geen API is nodig om een naam of continent op te zoeken.
6. **De data en de assets zijn gegenereerd en gecommit.** `scripts/generate-flags.ts` haalt de bronnen eenmalig op en schrijft zowel de lijst als de SVG's. `pnpm run flags:check` controleert daarna offline of elk land een vlag heeft, of elke vlag bij een land hoort en of geen enkele SVG naar een externe host verwijst. De app zelf doet nooit een netwerkrequest.
7. **Alleen soevereine staten.** De lijst bevat de landen die Wikidata als soevereine staat ziet en die een ISO-code hebben. Gebieden als Gibraltar zijn uitgesloten; de correcties op namen en continenten staan als expliciete uitzonderingen in het generatiescript.
8. **Geen timer en geen levens.** Zoals bij Tafel Topper kost een fout antwoord een ster, krijgt het kind uitleg en gaat het spel gewoon verder. De beste score per continent en niveau staat in `localStorage` onder `games.vlaggen.v1`.

## Bronnen

- **Vlaggen (SVG) en continentindeling:** [lipis/flag-icons](https://github.com/lipis/flag-icons) 7.6.0, licentie **MIT**. Bestanden uit `flags/4x3/<code>.svg` via `https://cdn.jsdelivr.net/npm/flag-icons@7.6.0/`. De vlaggen zelf zijn publiek domein; de repository levert de bestandsstructuur en de indeling per continent.
- **Nederlandse landennamen en de selectie van soevereine staten:** [Wikidata](https://www.wikidata.org), licentie **CC0**. De query vraagt om staten (`wdt:P31/wdt:P279* wd:Q3624078`) met een ISO 3166-1 alpha-2-code (`wdt:P297`) en hun Nederlandse label.
- **Motivatie en alternatieven:** `docs/research/2026-10-18-opensource-webgames.md` en `docs/research/2026-10-18-woordzoeker-libraries.md` (voor de afweging om geen package toe te voegen).

De volgende kandidaten zijn onderzocht en afgevallen:

- [`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries) (MIT) heeft Nederlandse namen, maar de herkomst van die namen loopt via `iso-codes` met een andere licentie dan MIT. Wikidata levert dezelfde namen onder CC0 en houdt de licentieketen kort.
- [`world-atlas`](https://www.npmjs.com/package/world-atlas) en TopoJSON-bestanden zijn niet nodig: er is geen kaart, alleen vlaggen en namen.
- Een runtime-koppeling met een vlaggen-API of CDN is in strijd met ADR 0001 en de CSP.

## Gevolgen

- De repository groeit met **1,28 MB** aan vlaggen (197 bestanden, mediaan 725 bytes). Vijf vlaggen met een wapen zijn groot: Servië 177 KB, Bolivia 100 KB, Mexico 83 KB, Spanje 79 KB, El Salvador 75 KB. Ter vergelijking: de Pokémon-assets zijn samen 12 MB.
- `apps/games/public/_headers` krijgt een regel `/flags/*` met `Cache-Control: public, max-age=604800`. De CSP blijft ongewijzigd.
- De attributie voor `flag-icons` (MIT) en Wikidata (CC0) staat in deze ADR; er is geen verplichte bronvermelding in de UI, maar de licentie-eis van MIT vraagt wel om de licentievermelding bij het bestand. Wie de vlaggen hergebruikt, moet de MIT-licentie van `flag-icons` meenemen.
- De vlaggen komen uit een externe repository, dus een nieuwe versie kan andere bestanden of namen opleveren. Wijzigingen in de bron zijn zichtbaar als diff in `countries.ts` en in `apps/games/public/flags/`.
- De repo heeft geen eigen `LICENSE` of `NOTICE`. Deze ADR is de plek waar de herkomst per asset-vorm is vastgelegd, net als ADR 0005 dat voor Pokémon doet.
- De Nederlandse namen zijn de Wikidata-labels met een korte correctielijst (`CN`, `NL`, `NR`, `PS`, `ST`, `SZ`). Twijfelgevallen kunnen zonder nieuwe bron worden bijgesteld in `NAME_OVERRIDES` in het generatiescript, gevolgd door `pnpm run flags`.
