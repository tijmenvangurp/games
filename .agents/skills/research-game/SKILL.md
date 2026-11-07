---
name: research-game
description: Onderzoek een nieuw kinderspel of een uitbreiding voor de games-repo. Werk het spelconcept uit, zoek passende libraries en open bronnen en adviseer hoe het spel technisch en visueel aansluit op de bestaande games.
---

# Onderzoek een spel

1. Lees `AGENTS.md`, `README.md`, `package.json` en relevante documenten
   uit `docs/research/` en `docs/adr/`. Bekijk één of twee bestaande games
   die qua interactie, doelgroep of lesopbouw dichtbij liggen.

2. Beschrijf wat een kind leert of oefent, wat het tijdens één ronde doet,
   welke feedback het krijgt en hoe het spel moeilijker wordt. Benoem
   aannames over leeftijd, taal en invoer. Baken een eerste versie af.

3. Splits het spel op in onderdelen, zoals regels, spelmechanieken,
   invoer, lesinhoud, UI, beeld en geluid. Het doel is het wiel niet
   opnieuw uit te vinden: bestaande oplossingen versnellen de ontwikkeling.
   Zoek per onderdeel eerst naar hergebruik in de repo (de tabel in
   `AGENTS.md`, `libs/`, `package.json`). Zoek daarna per onderdeel naar
   passende open-source libraries voor de spelmechanieken, npm-packages,
   open datasets of voorbeeldspellen.

   Zoek ook naar herbruikbaar beeld en geluid, eerst in de repo
   (`apps/games/public/`, `LICENSES/`, iconensets, `docs/adr/` en eerdere
   `docs/research/`-notities over assets), daarna in open bronnen. Gebruik
   alleen bronnen met een licentie die hergebruik in een publieke site
   toestaat (bijvoorbeeld CC0, publiek domein, MIT) en noteer licentie,
   bron en attributieplicht. Beeld en geluid moeten lokaal meegeleverd
   kunnen worden, zonder externe requests.

4. Vergelijk serieuze kandidaten op API, versie, onderhoud, licentie,
   TypeScript-typen, ESM en React/Vite-compatibiliteit. Controleer of ze
   lokaal in de browser werken binnen de CSP, zonder backend of externe
   requests. Leg per kandidaat uit welk eigen werk die bespaart en
   welke code, inhoud en vormgeving het team zelf moet maken.

5. Toets bij twijfel de belangrijkste aanname met een kleine proef
   buiten de applicatie. Noteer versie, omgeving en uitkomst. Maak
   onderscheid tussen documentatie, eigen testresultaten en open vragen.

6. Geef één voorkeursroute met onderbouwing. Noem concrete games en
   componenten om visueel op aan te sluiten. Leg uit welke harde eis
   doorslaggevend is als eigen code nodig blijkt.

## Onderzoeksnotitie

Schrijf in het Nederlands. Gebruik als voorgesteld pad
`docs/research/YYYY-MM-DD-<spel-slug>.md`.

- Datum, status, aanleiding, onderzoeksvraag en kader
- Kort advies
- Spelconcept en afbakening van de eerste versie
- Bestaand hergebruik in de repo
- Vergelijking van libraries en andere bronnen
- Herbruikbaar beeld en geluid, met bron en licentie
- Integratieschets en aansluiting op de bestaande frontend
- Verificatie, risico’s en open vragen
- Bronnen

Rond af met de onderzoeksnotitie. Wijzig de applicatie of dependencies
alleen als de gebruiker ook om implementatie vraagt.
