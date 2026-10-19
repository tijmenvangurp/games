# ADR 0016: Wereldkaart met d3-geo en Natural Earth

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0003](0003-originele-spelassets.md), [ADR 0015](0015-vlaggenspel.md)

## Context

ADR 0015 bracht het vlaggenspel: vlaggen en landennamen, per continent. Wereldoriëntatie stopt daar niet. De eerstvolgende stappen zijn de Nederlandse provincies (met hun vlaggen) en later kaartspellen: waar ligt een land, waar liggen de provincies, waar stromen de rivieren. De bezwaren tegen een kaart zijn:

- De app is statisch en de CSP staat alleen `'self'` toe. Een kaartdienst of tegelserver is uitgesloten; de geometrie moet mee in de build of als eigen bestand worden geserveerd.
- De repo is openbaar en de licentieketen moet kloppen.
- Mobiel eerst: een kaart moet op 390 px bruikbaar zijn en de bundel mag niet onnodig groeien.
- De kaart is leerzaam, maar niet de kern van een vraag. Als de kaart niet laadt, moet het spel gewoon doorlopen.

De vlaggen van de twaalf provincies zijn een aparte bron: ze staan niet in `flag-icons`, maar op Wikimedia Commons.

## Beslissing

1. **Eén geo-stack voor alle kaarten.** `d3-geo` (projecties en paden) en `topojson-client` (TopoJSON naar GeoJSON) zijn de enige kaart-dependencies. Beide zijn **ISC**, klein en zonder eigen data of netwerkverkeer. `d3-geo` levert de Mercator-projectie en `geoPath`; `topojson-client` zet de TopoJSON om naar GeoJSON.
2. **Geometrie van Natural Earth 1:110m**, via [`world-atlas`](https://www.npmjs.com/package/world-atlas) 2.0.2 (**ISC**, data **publiek domein**). Het bestand `countries-110m.json` (105 KB) staat gecommit in `libs/entities/geography/model/world-110m.json`; daarmee bouwt de app de kaart zonder netwerk.
3. **De kaart is een apart chunk.** `world.ts` laadt de atlas met een dynamische `import(...?raw)`. Het startscherm en de vragen downloaden de geometrie dus niet; pas als een antwoord onthuld wordt, komt de kaart in beeld. Bij een mislukte laadpoging blijft de kaart weg en blijft de tekstuele uitleg staan.
4. **De kaart zoomt op het onderwerp.** De projectie kiest het middelpunt van het land en een venster dat meeschaalt met de omvang van het grootste deel van het land (minimaal 12°, maximaal 100° lengtegraad). Overzeese delen zoals Frans-Guyana bepalen de zoom niet; anders zou de kaart van Frankrijk de Atlantische Oceaan tonen. Een marker op het middelpunt maakt ook kleine eilanden en staten zonder omtrek zichtbaar.
5. **De kaart is decoratief.** De SVG heeft `aria-hidden`; de uitleg noemt de naam, het gebied en de hoofdstad. Een schermlezer hoeft geen kaartvormen voor te lezen.
6. **Provincies zijn onderwerpen, geen landen.** De entity heet daarom `entities/geography`, met `FlagSubject` als gemeenschappelijke vorm. `Country` en `Province` zijn de twee soorten; de quizregels, de opslag en de UI werken met `FlagSubject`. Een provincie heeft geen ISO 3166-1 numeric-code en dus geen omtrek in de wereldatlas: die krijgt alleen de marker.
7. **De Nederlandse provincies komen erbij als eigen scope.** De twaalf provincies met ISO 3166-2-code (`nl-dr` … `nl-zh`), Nederlandse naam, hoofdstad en coördinaten komen uit Wikidata (CC0). De vlaggen komen van Wikimedia Commons en zijn alle twaalf **publiek domein**; het generatiescript weigert een bestand met een andere licentie.
8. **Landen krijgen er drie velden bij**: de hoofdstad (Nederlands label, met de Engelse als terugval), de ISO 3166-1 numeric-code en de coördinaten. De numeric-code is de sleutel waarop Natural Earth en vrijwel elke andere geo-dataset joinen; de coördinaten maken een marker mogelijk zonder geometrie.

## Bronnen

| Onderdeel                                          | Bron                                                                                                                      | Licentie             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Projecties en SVG-paden                            | [d3-geo](https://github.com/d3/d3-geo) 3.1.1                                                                              | ISC                  |
| TopoJSON naar GeoJSON                              | [topojson-client](https://github.com/topojson/topojson-client) 3.1.0                                                      | ISC                  |
| Landsomtrekken (1:110m)                            | [world-atlas](https://github.com/topojson/world-atlas) 2.0.2, data van [Natural Earth](https://www.naturalearthdata.com/) | ISC / publiek domein |
| Provincies: namen, codes, hoofdsteden, coördinaten | [Wikidata](https://www.wikidata.org) (`P31 Q134390`, `P300`, `P36`, `P625`)                                               | CC0                  |
| Provincievlaggen                                   | [Wikimedia Commons](https://commons.wikimedia.org), twaalf SVG-bestanden                                                  | publiek domein       |

De vlaggen zijn per bestand gecontroleerd: het generatiescript vraagt de licentiemetadata op en accepteert alleen publiek domein of CC0. De bestandsnamen staan in `PROVINCE_FLAGS` in `scripts/generate-geography.ts`, zodat een verdwenen of hernoemd bestand de generatie laat falen in plaats van stil een verkeerde vlag op te leveren.

Afgevallen:

- **Kaartdiensten (Mapbox, OpenStreetMap-tegels, Google Maps).** Externe requests, API-sleutels en een CSP-uitzondering; in strijd met ADR 0001.
- **`world-atlas` 1:50m of 1:10m.** Mooier, maar 250 KB tot meerdere MB gezipt. 1:110m dekt 174 van de 197 landen met een omtrek; de overige 23 zijn kleine eilandstaten en krijgen een marker. Voor een kinderspel is dat genoeg en het scheelt een factor vijf in download.
- **Een eigen getekende wereldkaart.** Veel werk, moeilijk actueel te houden en niet nodig nu Natural Earth vrij is.
- **De geometrie als publiek bestand plus `fetch`.** De CSP staat `connect-src 'self'` toe, dus het kán, maar een dynamische import geeft dezelfde luiheid zonder eigen laad- en foutafhandeling en zonder een tweede pad naar dezelfde data.

## Gevolgen

- De hoofdbundel groeit met circa **15 KB gezipt** (projectie, TopoJSON-conversie en de extra landgegevens). De wereldatlas is een apart chunk van 108 KB (ongeveer 39 KB gezipt) dat alleen bij een onthuld antwoord wordt geladen; het startscherm blijft even groot.
- `apps/games/public/flags/` groeit met twaalf provincievlaggen (357 KB). Limburg (169 KB) en Zeeland (128 KB) zijn groot omdat het wapens zijn; de overige tien zijn samen kleiner dan 10 KB.
- De vlaggen van de provincies zijn publiek domein, dus er is geen attributieplicht in de UI. De herkomst staat in deze ADR en in de kop van `provinces.ts`.
- De atlas is een momentopname. `pnpm run geography` ververst hem; `pnpm run geography:check` controleert offline dat het bestand bestaat, het land-object heeft, minstens 170 omtrekken bevat en de omtrekken van de ijkpunten (Nederland, Frankrijk, Duitsland, Zuid-Afrika, Verenigde Staten) aanwezig zijn.
- De kaart is herbruikbaar: een latere provinciekaart of rivierenkaart kan dezelfde projectie-aanpak gebruiken, met eigen geometrie. De wereldatlas blijft dan voor landen.
- De data bevat nu ook hoofdsteden, numeric-codes en coördinaten. Dat maakt een later hoofdstadspel mogelijk zonder nieuwe bron.
