# Spelideeën

- **Datum:** 2026-10-19
- **Status:** Woordzoeker, Tafel Topper, Vlaggenreis en Mengelmoes zijn geïmplementeerd. De overige ideeën zijn nog niet gepland of goedgekeurd.
- **Aanleiding:** na de eerste spellen is de vraag welke educatieve spellen logisch volgen.
- **Kader:** de app blijft statisch en client-side. Geen backend, accounts, analytics of externe requests. Alle code, woorden en assets staan lokaal in de repository. Nieuwe spellen volgen de bestaande FSD-opzet: een entity voor pure regels, een feature voor de Zustand-store en UI, een page, een route en tests.

## Wat er nu is

| Spel                 | Route          | Leerzame kant                                                                   |
| -------------------- | -------------- | ------------------------------------------------------------------------------- |
| Sudoku               | `/sudoku`      | Logisch redeneren, patroonherkenning, cijfers of dieren                         |
| Pijlen               | `/pijlen`      | Ruimtelijk inzicht, planning, doordacht bewegen                                 |
| Waar is Wobbel?      | `/zoeken`      | Visuele aandacht, observeren, vergelijken                                       |
| Woordzoeker          | `/woordzoeker` | Woordherkenning, spelling, visuele scanning                                     |
| Tafel Topper         | `/rekenen`     | Plus, min, keer en delen; getallenlijn en groepjes als uitleg                   |
| Pokémon Memory       | `/memory`      | Visueel geheugen, namen onthouden, concentratie                                 |
| Wie is deze Pokémon? | `/raad`        | Herkenning en lezen, met een meesterlevel met lookalike-namen                   |
| Schaaktutorial       | `/schaken`     | Bordgeometrie, regels, vooruitdenken; alle stukken en de eerste speciale regels |
| Schaakpuzzels        | `/puzzels`     | Mat en stukwinst herkennen in korte stellingen                                  |
| Vlaggenreis          | `/vlaggen`     | Vlaggen van landen per continent én van de Nederlandse provincies               |
| Mengelmoes           | `/mengelmoes`  | Associëren, combineren en ontdekken; 96 elementen en 104 recepten               |

De app dekt daarmee **logica, ruimte, geheugen, taal, rekenen, lezen, schaken, wereldoriëntatie en associëren**. Het grootste gat is nu **computationeel denken**.

## Mengelmoes (verticale slice)

**Leerdoel:** associëren, oorzaak-gevolg en nieuwsgierig experimenteren. Het kind sleept twee elementen op elkaar en ontdekt wat er ontstaat.

**Vorm:** een vrije werkbank met een schap van ontdekte elementen. Water, vuur, aarde en lucht zijn het startpunt; de eerste slice heeft 96 elementen en 104 recepten. Een ongeldige combinatie is geen fout: de elementen wiebelen en blijven staan. Er is een hint, een labboek met categoriefilters, sortering en een detailview per element, en lokale opslag. Sommige elementen hebben meerdere recepten, zodat er meer dan één route naar hetzelfde resultaat is.

**Techniek:** `entities/alchemy` bevat de pure elementen, recepten en graafregels; `features/alchemy-lab` de Zustand-store, opslag en UI; `pages/alchemy` het scherm. Drag-and-drop gebruikt de al aanwezige `@dnd-kit/core` met een eigen collision-detector op middelpuntafstand. De iconen zijn lokale Fluent Emoji Flat SVG's (MIT). Zie [het onderzoek](../research/2026-10-19-mengelmoes-assets.md) voor de bronnen, licenties en de visuele richting.

**Aandachtspunten:** de receptenboom is de grootste kostenpost. Elke nieuwe reeks moet kindvriendelijk, logisch en bereikbaar zijn. Geen timer, geen levens en geen straf bij een mislukte combinatie.

## Overzicht

| Prioriteit | Idee             | Domein                | Effort      | Kern                                                                   |
| ---------- | ---------------- | --------------------- | ----------- | ---------------------------------------------------------------------- |
| 1          | Woordzoeker      | Taal                  | Laag        | Geïmplementeerd; zie ADR 0011 en het richtingenonderzoek               |
| 2          | Tafel Topper     | Rekenen               | Laag        | Geïmplementeerd; zie ADR 0010                                          |
| 3          | Klokkijken       | Rekenen en tijd       | Middel      | Analoge klok lezen en zelf zetten                                      |
| 4          | Robo Route       | Computationeel denken | Middel      | Een programma van commando's maken en debuggen                         |
| 5          | Schaakmat in 1   | Schaken               | Laag        | Deels gedekt door Schaakpuzzels; nog eigen oefeningen                  |
| 6          | Provincie Prik   | Wereldoriëntatie      | Middel-hoog | Kaartspel met provincies; vlaggen en hoofdsteden zijn klaar (ADR 0018) |
| 7          | Breuken en geld  | Rekenen               | Middel      | Visuele breuken en rekenen met munten                                  |
| 8          | Noten lezen      | Muziek                | Middel      | Noten en gehoor via WebAudio                                           |
| 9          | Kleine varianten | Taal en natuur        | Laag        | Letter-memory, Woordbouw, Dierenquiz, Verkeersborden                   |

## 1. Woordzoeker

**Leerdoel:** woorden herkennen, spelling oefenen, visueel scannen en de woordenschat van een thema versterken.

**Vorm:** een klassieke woordzoeker met de thema's **Tuin**, **Onder water** en **Pokémon**. De speler sleept over een woord of tikt de eerste en de laatste letter aan. Gevonden woorden krijgen een handgetekende streep. Er zijn drie maten: 10×10 met 8 woorden, 12×12 met 10 woorden en 14×14 met 12 woorden. Makkelijk zoekt alleen links-naar-rechts en boven-naar-beneden, gemiddeld voegt de diagonale richtingen toe en moeilijk opent alle acht richtingen. Op mobiel kan het bord tussen "passend" en "vergroot" (minstens 44 px per cel) wisselen.

**Waarom:** taal is het grootste gat in het huidige aanbod. Een woordzoeker is laagdrempelig, goed te herspelen en vraagt geen nieuwe backend of externe assets.

**Techniek:** `libs/entities/word-search` bevat een eigen seedbare generator en de selectieregels, `libs/features/word-search` de Zustand-store en UI, `libs/pages/word-search` het scherm. Er is geen generator-dependency meer. De hele puzzel wordt lokaal bewaard. Zie [ADR 0011](../adr/0011-woordzoeker-richtingen.md).

**Aandachtspunten:** de richtingen zijn per niveau vastgelegd; zo blijft makkelijk echt makkelijk. Voor 44 px-cellen is op mobiel de zoomstand nodig. Zie `research/2026-10-18-woordzoeker-libraries.md` voor de onderbouwing.

## 2. Tafel Topper

**Leerdoel:** optellen en aftrekken tot 10, 20 of 100, tafels 1–5, 1–10 en 6–10, en delen.

**Vorm:** kies plus, min, keer of delen en daarna een niveau. Een ronde bestaat uit tien korte sommen met drie antwoordkeuzes. Een eerste fout kost geen ster en geeft één herkansing; daarna volgt het juiste antwoord met uitleg. Plus en min krijgen een getallenlijn, keer en delen een veld met groepjes stippen. Er is geen timer.

**Waarom:** hoog leerrendement per regel code, onbeperkt herspeelbaar en volledig te testen met pure functies.

**Techniek:** `entities/math` met een seedbare generator en regels, `features/math-trainer` met Zustand en UI, een eigen page en route. Geen nieuwe dependencies. De beste score per mode en niveau staat in `localStorage` onder `games.math.v1`. Zie [ADR 0010](../adr/0010-tafel-topper.md).

**Aandachtspunten:** geen straf voor fouten, geen verdwijnende levens, geen verplichte timer. Verschillende niveaus moeten echt verschillende vaardigheden raken, niet alleen grotere getallen.

## 3. Klokkijken

**Leerdoel:** een analoge klok lezen, hele uren tot 5 minuten, en digitaal omzetten naar analoog en terug.

**Vorm:** een zelfgetekende SVG-klok. Twee modi: "Hoe laat is het?" met meerkeuze, en "Zet de wijzers" door te tikken of te slepen. Korte contextzinnen zoals "Om 8 uur ga je naar school" maken de tijd betekenisvol. Niveaus: hele uren, halve uren, kwartieren en 5 minuten.

**Waarom:** sterk visueel, veel geoefend op de basisschool en volledig te maken zonder externe plaatjes of bibliotheken.

**Techniek:** `entities/clock` voor tijdberekeningen en niveau-opbouw, `features/clock-reading` voor de store en UI. Knoppen als alternatief voor slepen, minimaal 44 px touch-targets en testen op 390 px en 1024 px.

**Aandachtspunten:** onderscheid tussen "over" en "voor half" is in het Nederlands lastig. Kies één consequente uitleg en test die met kinderen.

## 4. Robo Route

**Leerdoel:** sequentiële instructies, herhaling, plannen en debuggen.

**Vorm:** een robot in een grid moet sterren pakken. Het kind sleept commando's (vooruit, links, rechts, later "herhaal 3×") in een programma en drukt op **Start**. Gaat het mis, dan stopt de robot en verbetert het kind het programma. Niveaus bouwen op van losse stappen naar herhaling en langere routes.

**Waarom:** echt anders dan Pijlen. Pijlen is reageren en sturen; Robo Route is eerst nadenken, dan uitvoeren. Dat is de basis van programmeren.

**Techniek:** een pure interpreter en levels in `entities/robot`, een eigen feature en page. Geen dependencies. De levels kunnen later worden uitgebreid met obstakels, sleutels en meerdere robots.

**Aandachtspunten:** fouten moeten leerzaam zijn. Toon waar het programma misgaat en laat het kind de fout herstellen zonder het hele level opnieuw te hoeven starten.

## 5. Schaakmat in 1

**Leerdoel:** schaakmat herkennen en zetten leren plannen.

**Vorm:** korte stellingen waarin het kind in één zet schaakmat zet. Na de zet laat de app zien waarom het mat is. Daarna een nieuwe stelling. Niveaus: mat met de dame, met de toren, met twee stukken en met een pion.

**Waarom:** de bestaande tutorial leert de regels en `Schaakpuzzels` dekt al korte puzzels. Dit idee is een gerichte uitbreiding daarvan, niet een nieuw spel.

**Techniek:** uitbreiding van de bestaande `features/chess-puzzles` en de bijbehorende entity, met `chess.js`. Geen nieuwe dependencies.

**Aandachtspunten:** alleen stellingen opnemen die met de bestaande engine gevalideerd zijn. Geen stellingen waarin meerdere zetten mat geven zonder dat de uitleg dat aankan.

## 6. Provincie Prik

**Leerdoel:** de twaalf provincies en hun hoofdsteden kennen, en Nederland op de kaart plaatsen.

**Vorm:** een vereenvoudigde, zelfgetekende SVG-kaart van Nederland. Modi: "Waar ligt Friesland?", "Wat is de hoofdstad van Gelderland?" en "Sleep de provincie naar de juiste plek". De kaart is het middelpunt; de vragen zijn kort.

**Waarom:** wereldoriëntatie is met Vlaggenreis (/vlaggen, ADR 0015) begonnen. De provincievlaggen, namen en hoofdsteden zitten daar nu in; wat nog ontbreekt is de kaart: waar ligt elke provincie? Dat is een klassiek onderwerp voor groep 5 tot en met 8.

**Techniek:** `entities/netherlands` met provincies, hoofdsteden en posities, `features/province-quiz` met de UI. Een zorgvuldige, originele SVG-kaart is het grootste werk. Geen externe kaart of API.

**Aandachtspunten:** de kaart moet kloppen en auteursrechtelijk veilig zijn. Overweeg een eigen vereenvoudigde vorm in plaats van een bestaande kaart over te nemen. Voor de posities zijn geen exacte geografische coördinaten nodig, alleen herkenbare vlakken.

## 7. Breuken en geld

**Leerdoel:** breuken herkennen en vergelijken, en rekenen met euro's.

**Vorm:** breuken met pizza's, taarten of chocoladerepen: "Welk deel is gekleurd?" en "Wat is meer?". Geld met munten en briefjes: "Hoeveel is dit?" en "Betaal 3,50 met zo weinig mogelijk munten". Sluit aan op Tafel Topper.

**Waarom:** concrete, visuele rekenvaardigheid die goed past bij dezelfde generator en opslag als Tafel Topper.

**Techniek:** uitbreiding van `entities/math` of een aparte entity `money`. Eigen SVG of emoji voor munten en breuken. Geen dependencies.

**Aandachtspunten:** gebruik geen bedragen met privacygevoelige voorbeelden. Houd het bij algemene bedragen en duidelijke munten.

## 8. Noten lezen

**Leerdoel:** noten op de notenbalk herkennen en intervallen horen.

**Vorm:** een notenbalk met een noot; het kind kiest de juiste naam. Een tweede modus speelt twee tonen en vraagt welke hoger is. Later een korte melodie naspelen.

**Waarom:** muziek ontbreekt nog. WebAudio kan tonen synthetiseren zonder audiobestanden of externe requests.

**Techniek:** `entities/music` voor noten en frequenties, `features/note-reading` voor de UI en WebAudio. Geen assets nodig.

**Aandachtspunten:** geluid moet altijd dempbaar zijn en nooit automatisch starten. Voor jonge kinderen is visuele ondersteuning belangrijker dan muziektheorie. Toegankelijkheid zonder geluid moet mogelijk blijven.

## 9. Kleine varianten

Deze ideeën zijn klein genoeg om als variant op een bestaand spel te beginnen.

- **Letter-memory:** memory met hoofdletters en kleine letters, of met een woord en een bijpassend plaatje. Hergebruikt de memory-infrastructuur.
- **Woordbouw:** sleep letters naar de juiste plek bij een emoji of tekening. Geschikt voor spelling zoals ei/ij en au/ou. Gebruik een eigen, korte woordenlijst.
- **Dierenquiz:** "Welk dier is dit?" met originele tekeningen of emoji, plus één weetje per dier. Past bij de natuur en wereldoriëntatie.
- **Verkeersborden:** herken borden en weet wat ze betekenen. Leerzaam en veilig, maar vraagt originele SVG-borden.

## Gemeenschappelijke aanpak

Voor elk nieuw spel:

1. Pure regels en generatoren in `libs/entities/<domein>`.
2. Een Zustand-store en UI in `libs/features/<naam>`.
3. Een page in `libs/pages/<naam>`, een route in `apps/games/src/app/router.tsx` en een entry in `libs/entities/game/model/game-catalog.ts`.
4. Tests in `tests/node` voor de pure logica en in `tests/web` voor de UI.
5. Een e2e-test voor de belangrijkste mobiele flow.
6. Geen nieuwe dependency zonder expliciete afweging. Als een dependency nodig is, eerst een ADR.
7. Voortgang alleen lokaal in `localStorage`, met een eigen versie-key.
8. Touch-targets van minimaal 44 px, veilige marges en testen op 390 px en 1024 px.

## Open vragen

- Voor welke leeftijd is elk spel precies bedoeld? De huidige spellen lopen van ongeveer 4 tot 10 jaar.
- Willen we op de homepage gaan groeperen op **Rekenen, Taal, Denken en Wereld** zodra er meer dan acht spellen zijn?
- Moet er een oudervriendelijk overzicht komen met leerdoelen per spel?
- Blijft voortgang alleen lokaal, of is een gedeelde score ooit gewenst? Dat laatste vraagt een nieuwe ADR en een privacyontwerp.
- Willen we de ideeën al als `coming-soon` in de catalogus tonen, of pas als ze echt bijna af zijn?
