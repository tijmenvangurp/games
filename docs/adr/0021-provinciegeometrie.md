# ADR 0021: Provinciegeometrie uit Natural Earth

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Bouwt voort op:** [ADR 0019](0019-wereldkaart.md), [ADR 0020](0020-kaartpuzzel.md)

## Context

De wereldatlas uit ADR 0019 bevat alleen landgrenzen. Daardoor kon de kaartpuzzel nog niet met de Nederlandse provincies spelen en kreeg elke provincie in de vlaggenquiz dezelfde marker op de kaart van Europa. De twaalf provincies hebben wel vlaggen, namen en hoofdsteden (ADR 0018), maar geen vorm.

Voor provincievormen zijn er meerdere bronnen:

- **CBS / PDOK (Bestuurlijke Grenzen).** Actueel en officieel, maar de open data staan onder **CC BY 4.0**: dan moet de app een zichtbare bronvermelding dragen.
- **Eurostat GISCO (NUTS).** De Nederlandse NUTS2-regio's vallen samen met de twaalf provincies, maar de licentie vraagt om naamsvermelding (© Europese Unie).
- **Wikimedia Commons.** Kaarten en SVG's van wisselende kwaliteit en licentie (vaak CC BY-SA).
- **[Natural Earth](https://www.naturalearthdata.com/) admin-1.** Dezelfde bron en licentie als de wereldatlas: **publiek domein**, dus geen attributieplicht. De 1:10m-variant bevat alle twaalf provincies met ISO 3166-2-codes; de 1:50m-variant bevat alleen grote landen en heeft géén Nederlandse provincies.

## Beslissing

1. **Natural Earth 1:10m admin-1**, gepind op release **v5.1.2** van `nvkelso/natural-earth-vector`. Het generatiescript haalt het bestand eenmalig op (ongeveer 40 MB) en bewaart alleen de twaalf features met `iso_3166_2` `NL-DR` … `NL-ZH` en `type_en` `Province`. De Caribische bijzondere gemeenten (Bonaire, Saba, Sint Eustatius) vallen af.
2. **Coördinaten op vier decimalen** (ongeveer 11 meter) en als geminifieerde GeoJSON in `libs/entities/geography/model/provinces-10m.json`. Dat is **48 KB**; het bestand staat in `.prettierignore` omdat het gegenereerd is en niet door de formatter heen moet.
3. **De codes zijn de sleutel.** Elk feature heeft alleen `properties.code`, gelijk aan de ISO 3166-2-code in kleine letters uit `provinces.ts`. Het generatiescript controleert dat er precies twaalf vlakken zijn en `geography:check` controleert offline dat elk vlak bestaat en een `Polygon` of `MultiPolygon` is.
4. **De provinciegeometrie is een eigen lazy chunk.** Net als de wereldatlas wordt het bestand met een dynamische `import(...?raw)` geladen. Wie alleen landen speelt, downloadt het niet.
5. **Twee toepassingen.** De kaartpuzzel gebruikt de provincievormen voor de board en de stukken (`provincePuzzleMap`); de vlaggenquiz toont bij een provincie de kaart van Nederland met die provincie uitgelicht (`provinceMap`). De wereldkaart blijft voor landen.
6. **Eén generieke kaartbouwer.** `buildPuzzleMap` werkt met een shape-map en een lijst onderwerpen met coördinaten; landen en provincies leveren alleen andere shapes en context aan. Zo blijft de projectie, het fitten en de stuknormalisatie één implementatie.

## Bronnen

| Onderdeel          | Bron                                                                                           | Licentie       |
| ------------------ | ---------------------------------------------------------------------------------------------- | -------------- |
| Provinciegrenzen   | [Natural Earth 1:10m admin-1](https://github.com/nvkelso/natural-earth-vector), release v5.1.2 | publiek domein |
| Projectie en paden | `d3-geo` 3.1.1, `topojson-client` 3.1.0                                                        | ISC            |

## Gevolgen

- De repository groeit met **48 KB** provinciegeometrie (ongeveer 16 KB gezipt), in een apart chunk. De landenkaart en de vlaggenquiz voor landen blijven ongewijzigd.
- De generator doet er een download van 40 MB bij. Dat gebeurt alleen bij `pnpm run geography`, nooit in de app of in CI.
- De provinciekaart is een momentopname van Natural Earth, niet van de actuele bestuurlijke grenzen. Voor een kinderspel is de generalisatie prima; wijzigingen komen als diff in `provinces-10m.json`.
- De kaartpuzzel kan nu ook de provinciescope spelen (twaalf shapes, acht stukken per ronde). De vlaggenquiz toont bij provincies een echte provinciekaart in plaats van een marker op Europa.
- Er is geen attributieplicht in de UI; de herkomst staat in deze ADR, in de kop van de generator en in de bestandsnaam van de bron.
- Een latere kaart van bijvoorbeeld gemeenten of waterschappen kan dezelfde werkwijze volgen: een publiek-domeinbron, een klein gecommit bestand en dezelfde generieke kaartbouwer.
