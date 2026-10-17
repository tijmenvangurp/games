# ADR 0003: Originele spelassets in plaats van beschermde personages

- **Status:** Superseded by [ADR 0005](0005-pokemon-assets.md)
- **Datum:** 2026-10-17

## Context

Er kwam een verzoek voor een memory met Pokémon. Deze repository en de bijbehorende site zijn openbaar. Officiële Pokémon-afbeeldingen, namen en personages zijn auteursrechtelijk en als merk beschermd. Een bestaande online database of API gebruiken lost dat niet op: de afbeeldingen blijven beschermd, en een runtime-koppeling zou bovendien bezoekers-IP's naar een derde partij sturen, offline spelen breken en de strikte CSP en `noindex`-opzet ondermijnen.

## Beslissing

- De app gebruikt **originele, zelfgetekende monstertjes** in SVG. Geen officiële Pokémon-afbeeldingen, namen of logo's.
- Er komen **geen runtime-koppelingen** naar externe databases of API's. Alle speldata en assets staan lokaal in de repository.
- De memory heet **Monster Memory** en gebruikt tien eigen personages met eigen namen.
- Wie later gelicenseerde of zelfgemaakte kaarten wil gebruiken, levert die assets zelf aan. Zulke bestanden horen niet in deze publieke repository; daarvoor is een aparte, niet-openbare hostingplek nodig, met goedkeuring van de eigenaar.

## Gevolgen

- De game voelt als een zoek-en-vind- of memoryspel, maar is geen officieel Pokémon-product.
- De app blijft volledig statisch, offline bruikbaar en vrij van externe requests.
- Een toekomstige integratie met een database voor scores of accounts vereist een nieuwe ADR met een privacy- en beveiligingsontwerp.

> Deze beslissing is op 2026-10-17 vervangen door ADR 0005. De eigenaar heeft expliciet gekozen voor lokaal gebundelde Pokémon-assets.
