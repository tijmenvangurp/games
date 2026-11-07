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

3. Splits het spel op in onderdelen, zoals regels, invoer, lesinhoud, UI
   en audio. Zoek eerst naar hergebruik in de repo. Zoek daarna per
   onderdeel naar passende npm-packages, open datasets of voorbeeldspellen.

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
- Integratieschets en aansluiting op de bestaande frontend
- Verificatie, risico’s en open vragen
- Bronnen

Rond af met de onderzoeksnotitie. Wijzig de applicatie of dependencies
alleen als de gebruiker ook om implementatie vraagt.
