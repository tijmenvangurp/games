# ADR 0010: Tafel Topper als lokale reken trainer

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De app had nog geen spel voor rekenen. Kinderen oefenen op school plus, min, keer en delen, maar een oefenspel mag geen straf, verplichte timer of backend nodig hebben. De app is statisch en bewaart voortgang alleen lokaal.

De eerste versie moet vier soorten sommen dekken: optellen, aftrekken, keer en delen. Per soort zijn er drie niveaus. Een ronde bestaat uit tien korte sommen met drie antwoordkeuzes. Na een fout mag het kind het nog één keer proberen; daarna volgt het juiste antwoord met een korte uitleg en een visuele voorstelling.

## Beslissing

1. **Pure generator in `libs/entities/math`.** `createRound(mode, level, seed)` maakt tien unieke sommen met een seedbare `mulberry32`. De generator kent geen React, opslag of UI.
2. **Vier modes en drie niveaus.**
   - Optellen en aftrekken: tot 10, tot 20 of tot 100.
   - Keer en delen: tafels 1–5, tafels 1–10 of tafels 6–10.
3. **Drie antwoordkeuzes per som.** De juiste keuze plus twee plausibele afleiders dicht bij het antwoord. De keuzes zijn nooit negatief en altijd uniek.
4. **Eén herkansing per som.** Een eerste fout kost geen ster en zet de streak op nul. Een tweede fout toont het juiste antwoord en de uitleg. Er is geen timer en geen aftellende levens.
5. **Sterren en lokale beste score.** Een ster per som die in één keer goed gaat. De beste score per mode en niveau staat in `localStorage` onder `games.math.v1`. De ronde zelf wordt niet bewaard.
6. **Visuele uitleg.** Optellen en aftrekken krijgen een getallenlijn; keer en delen een veld met groepjes stippen. De uitleg staat ook als tekst, zodat de game zonder visuele voorstelling bruikbaar blijft.
7. **Geen nieuwe dependencies.** Geluid en haptiek komen uit `@shared/lib`. De app blijft statisch en doet geen externe requests.

## Gevolgen

- De rekenlogica is met pure functies te testen: bereik, unieke sommen, juiste antwoorden en geldige keuzes.
- De beste score is lokaal en niet te delen. Een gedeelde score of account vereist een nieuwe ADR met een privacyontwerp.
- De niveaus zijn bewust breed genoeg voor verschillende leeftijden. Specifieke tafels kiezen (bijvoorbeeld alleen de tafel van 7) kan later als extra instelling worden toegevoegd.
- Breuken, geld en een optionele timer passen op dezelfde generator en store, maar vallen buiten deze eerste versie.
