# ADR 0012: Pokémon-kruiswoordpuzzel

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

Na de woordzoeker kwam de vraag of er ook een kruiswoordpuzzel met een **Pokémon-categorie** kan komen. Een kruiswoord vraagt een grid met zwarte blokken, genummerde startvakjes, horizontale en verticale clues en een invoerflow. De app is statisch en gebruikt geen backend of externe API's.

De Pokémon-namen en lokale assets vallen onder [ADR 0005](0005-pokemon-assets.md). Voor deze eerste versie is geen nieuwe data of API nodig: een kleine set Generatie 1-namen met Nederlandse hints is genoeg.

## Beslissing

1. **Nieuw spel op `/kruiswoord`** met de categorie **Pokémon** en een handgemaakte puzzel van 8 × 9 met zes antwoorden.
2. **De puzzeldata staat lokaal** in `libs/entities/crossword`. `buildCrossword` controleert elk antwoord tegen de letters in het grid en nummert de startvakjes. Een fout in de data faalt luid, in plaats van een stille rare puzzel op te leveren.
3. **Geen runtime-generator en geen nieuwe dependency.** De eerste puzzel is handmatig ontworpen; later kunnen meer categorieën en puzzels als data worden toegevoegd.
4. **Invoer werkt met tikken en typen.** Een cel of clue aanklikken selecteert een woord. Er is een schermtoetsenbord van A–Z plus wissen, en een fysiek toetsenbord werkt met letters, backspace en pijltjes.
5. **Controleer en Hint.** Controleren markeert foute letters en viert een opgelost bord. Hint vult de geselecteerde letter in. Er is geen timer en geen straf.
6. **Alleen letters worden lokaal bewaard** onder `games.crossword.v1`. Bij herladen gaat het bord verder waar het was. Er zijn geen accounts, scores of externe requests.
7. **De categorie is zichtbaar in het instelscherm** en de subtitel. Zo kan dezelfde game later zonder UI-herontwerp meer categorieën krijgen.

## Gevolgen

- De eerste versie heeft één puzzel. Meer puzzels of categorieën vragen alleen nieuwe data en een selectie in de setup.
- De antwoorden zijn Engelse Pokémon-namen, zoals in de rest van de app; de clues zijn Nederlands.
- De puzzel is handmatig en dus niet eindeloos herspeelbaar. Een generator is een logische volgende stap als er veel puzzels nodig zijn.
- De layout en invoer zijn volledig eigen werk; er komt geen crossword-bibliotheek of externe dienst bij.
