# ADR 0009: Woordzoeker met een kleine generator-bibliotheek

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De app heeft al logica-, ruimte-, geheugen- en schaakspellen, maar nog geen taal-spel. Een woordzoeker sluit aan bij de bestaande thema's **Tuin** en **Onder water** van _Waar is Wobbel?_ en is volledig client-side te maken. De eisen zijn: 10×10, 12×12 en 14×14, 8 tot 12 woorden, Nederlandse woorden zonder accenten, coördinaten per woord voor de gevonden-status, en geen backend of externe requests.

Het bibliotheekonderzoek staat in [research/2026-10-18-woordzoeker-libraries.md](../research/2026-10-18-woordzoeker-libraries.md). Geen enkele bibliotheek combineert alle eisen. `@aydee-app/word-search` is de schoonste moderne optie: MIT, ESM, TypeScript, 1,8 KB gzip en nul runtime-dependencies. De nadelen zijn dat het pakket jong is, geen seed heeft en alleen vooruit plaatst.

## Beslissing

1. **`@aydee-app/word-search` 0.1.1 wordt exact gepind.** De generator zit achter een dunne adapter in `libs/entities/word-search`. Zo kan de bibliotheek later worden vervangen door een eigen generator zonder de UI aan te passen.
2. **Drie vaste formaten:** 10×10 met 8 woorden (makkelijk), 12×12 met 10 woorden (gemiddeld) en 14×14 met 12 woorden (moeilijk). Alleen horizontaal en verticaal op makkelijk; vanaf gemiddeld ook diagonaal naar beneden-rechts. Achteruit plaatsen kan met deze bibliotheek niet.
3. **Slepen of twee tikken.** In de passende weergave sleept het kind over de letters; de cellen ertussen lichten op. Twee tikken en het toetsenbord blijven werken. In de zoomstand staat pannen voorop en selecteert het kind met twee tikken.
4. **Zoomstand op mobiel.** Het bord past standaard op het scherm. Met **Vergroot** worden de cellen minstens 44 px en kan het bord horizontaal scrollen. Op tablet en desktop past 14×14 al ruim.
5. **De hele puzzel wordt lokaal bewaard.** De bibliotheek heeft geen seed. `localStorage` bewaart daarom `{ settings, puzzle, found }` onder `games.word-search.v1`. Bij het laden wordt de puzzel gevalideerd; bij corrupte data valt het spel terug op de instellingen.
6. **Woorden staan lokaal in de entity.** De thema's Tuin en Onder water hebben elk zestien woorden van 3 tot 7 letters. Er komen geen externe woordenlijsten, afbeeldingen of API's aan te pas.
7. **Geen nieuwe backend, accounts of analytics.** Geluid en haptiek gebruiken de bestaande `@shared/lib`-helpers.

## Gevolgen

- Er komt één runtime-dependency bij. De exacte versie en de lockfile maken de build reproduceerbaar; het pakket heeft geen install-scripts en nul runtime-dependencies.
- De generator is niet deterministisch. Tests controleren de invarianten (afmetingen, plaatsingen, letters, alle woorden geplaatst) in plaats van een vaste seed. Een herlaadde pagina toont hetzelfde bord omdat de puzzel zelf wordt opgeslagen.
- Achteruit geplaatste woorden en een seedbare replay zijn niet mogelijk zonder de bibliotheek te vervangen. Daarvoor is de adapter het vervangpunt; een eigen generator of `@blex41/word-search` is dan de volgende stap.
- Op een telefoon is 14×14 alleen prettig in de zoomstand. De standaardweergave is een overzicht; de zoomstand levert de 44 px-targets.
- Slepen is de primaire route in de passende weergave; in de zoomstand blijven pannen en twee tikken over. De woordenlijst is een extra toegankelijke route.
- De kwaliteitsgate dekt de nieuwe entity, feature, page, route, catalogusentry, opslag en e2e-flow. Nieuwe thema's vragen alleen een extra woordenlijst in `config.ts`.
