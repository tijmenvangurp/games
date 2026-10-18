# ADR 0011: Eigen woordzoeker-generator met richtingniveaus

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De eerste woordzoeker gebruikte `@aydee-app/word-search` (zie [ADR 0009](0009-woordzoeker.md)). Die bibliotheek plaatst alleen vooruit: horizontaal, verticaal en diagonaal naar beneden-rechts. Daarmee zijn geen moeilijkheidsniveaus op basis van leesrichting te maken.

De gewenste opbouw is:

- **Makkelijk:** alleen links naar rechts en boven naar beneden.
- **Gemiddeld:** ook de twee diagonale richtingen naar beneden.
- **Moeilijk:** alle acht richtingen, inclusief rechts naar links, omhoog en de diagonale richtingen andersom.

## Beslissing

1. **De bibliotheek wordt vervangen door een eigen, pure generator** in `libs/entities/word-search`, met de bestaande `mulberry32`/`createSeed` uit `@shared/lib`.
2. **De richtingen staan per niveau in `WORD_SEARCH_DIRECTIONS`.** Makkelijk heeft twee richtingen, gemiddeld vier en moeilijk acht.
3. **Elk woord wordt gegarandeerd geplaatst.** De generator probeert per woord maximaal 400 startpunten en richtingen. Lukt een puzzel niet, dan volgt een nieuwe poging met een lege grid, maximaal acht keer. Er verdwijnen dus geen woorden stil.
4. **Dezelfde seed geeft dezelfde puzzel.** Woordkeuze, plaatsing en vulletters gebruiken één deterministische randomreeks. De puzzel wordt nog steeds als geheel in `localStorage` bewaard.
5. **De dependency verdwijnt.** `@aydee-app/word-search` wordt uit `package.json` en de lockfile verwijderd. De generator is ongeveer 150 regels en heeft alleen `@shared/lib` nodig.
6. **Gevonden woorden krijgen een handgetekende streep.** De overlay ligt boven de letters met een dunne blauwe inktlijn en lage opacity, zodat de letters zichtbaar blijven.

## Gevolgen

- De app heeft geen jonge upstream-dependency meer voor de woordzoeker.
- Richtingen, formaten en woorden zijn volledig lokaal aan te passen. Een nieuw niveau of thema vraagt alleen een configuratiewijziging. Naast Tuin en Onder water is een Pokémon-thema met 25 namen toegevoegd.
- De generator is deterministisch en daardoor goed te testen: richtingen, plaatsingen, letters en het aantal woorden worden over veel seeds gecontroleerd.
- Oude opgeslagen puzzels blijven geldig; het opgeslagen formaat (`grid`, `placements`, `found`) is niet veranderd.
- De plaatsingscode is iets meer eigen code dan de bibliotheek, maar de UI en tests waren toch al eigen werk en de richtingniveaus waren met de bibliotheek niet mogelijk.
