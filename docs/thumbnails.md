# Spelthumbnails

Elke spelkaart op het startscherm gebruikt een lokale, geïllustreerde thumbnail. Dit document
bewaart de **stijlafspraken en de exacte prompts**, zodat een nieuw spel dezelfde prentenboekwereld
krijgt in plaats van een losse afbeelding.

De bestanden staan in `apps/games/public/thumbnails` als **800 × 500 JPEG** met een contenthash in
de naam. Dat houdt ze lang en immutable cachebaar (`apps/games/public/_headers`). Een nieuwe
afbeelding krijgt automatisch een nieuwe URL.

## Stijlafspraken

Elke thumbnail gebruikt dezelfde alinea, zodat de kaarten als één set lezen:

> Warm Scandinavian children's picture-book illustration in tactile cut-paper and matte gouache
> style on a warm ivory paper background (#f6f1e6). … Harmonious palette of craftsman indigo,
> botanical green, warm ochre, and soft terracotta with deep warm ink accents. Subtle layered paper
> shadows, wide 16:10 horizontal composition, generous margins, no text, no frame, no UI chrome.

Daaruit volgen de vaste regels:

1. **Warm papier, geen wit.** De achtergrond is ivoor (`#f6f1e6`), passend bij `--background`.
   Nooit puur wit of een gradient.
2. **Papier als materiaal.** Cut-paper, matte gouache en zachte laagschaduwen. Geen 3D-rendering,
   geen glanzende plastic look, geen stockfoto.
3. **Het palet van het design system.** Ambachtelijk indigo voor actie, botanisch groen, warm oker
   en terracotta. Geen regenboog, geen felle primaire kleuren.
4. **Eén onderwerp, veel lucht.** Het spelonderwerp staat centraal met ruime marge, omdat de kaart
   bij hover 3% inzoomt en de afbeelding 16:10 wordt bijgesneden.
5. **Geen tekst in beeld.** Geen spelnamen, geen zinnen, geen watermerken, geen logo's of
   beschermde personages (zie [ADR 0005](adr/0005-pokemon-assets.md)). Cijfers of losse letters
   mogen alleen als ze bij het spel horen, zoals de sudokutegels of de lettertrein.
6. **Geen UI-chrome.** Geen knoppen, geen kaders, geen schaduwranden van de app zelf.

### Letters en cijfers

Beeldmodellen verzinnen bij "letters" graag Noordse tekens (`Ø`, `Æ`, `Ö`). Noem daarom expliciet
_plain standard Latin letters A–Z_ en noem het woord dat je wilt zien, bijvoorbeeld `B-L-O-E-M`.
Controleer daarna altijd de afbeelding: één verkeerd teken betekent opnieuw genereren.

## Prompts per spel

De slug tussen haakjes is de bestandsnaam in `apps/games/public/thumbnails`. Vermeld bij een nieuw
spel dezelfde stijlalinea en daarna de scène.

### Sudoku (`sudoku`)

> A charming 4x4 wooden puzzle frame resting gently on warm ivory paper, holding four distinct cute
> painted-paper tiles placed cleanly with NO duplicate in any row or column: row 1 has a fox in col
> 1 and a blue tile '2' in col 3; row 2 has a bunny in col 2; row 3 has a cat in col 4; row 4 has a
> puppy in col 3. Beside the grid lie four neat spare indigo-and-cream numeral tiles labeled 1, 2,
> 3, 4.

### Tafel Topper (`math-trainer`)

> Playful Montessori wooden math tiles and abacus beads arranged cleanly in the center: chunky
> printed cardstock tiles with +, −, ×, ÷ symbols in craftsman indigo and terracotta, a handful of
> golden ochre paper stars, and neat rows of botanical-green counting beads.

### Pijlen (`arrows`)

> A clever winding heart-shaped maze formed from crisp geometric bent arrows in deep warm slate-ink
> and craftsman indigo, with one cheerful terracotta arrow gliding freely out into open space
> leaving a delicate trail of tiny dots.

### Waar is Wobbel? (`seek`)

> A playful crowd of round, friendly little painted-paper creature characters wearing colorful
> pointed caps (indigo, terracotta, ochre, sage), with one smiling creature near the center wearing
> a bright golden star on its cap and tiny botanical flowers scattered around.

### Woordzoeker (`word-search`)

> A charming 5x5 wooden-and-cream letter puzzle board with thick cardstock tiles showing ONLY plain
> standard Latin letters A–Z (never Nordic letters like Ø, Æ, or Ö), where a translucent
> botanical-green watercolor stroke clearly highlights the diagonal Dutch word B-L-O-E-M across the
> tiles. A small brass-and-indigo magnifying glass and a tiny paper leaf and terracotta flower rest
> beside the board.

### Mengelmoes (`alchemy`)

> A whimsical children's craft alchemy workbench featuring four colorful cut-paper element
> medallions—a blue water droplet, a warm terracotta flame, a botanical-green leaf sprout, and a
> swirling wind puff—floating gently toward a small glass beaker emitting golden ochre paper
> sparkles and a tiny playful cloud.

### Draaiwerk (`draaiwerk`)

> Meshing precision involute gears in deep slate-ink, craftsman indigo, and muted sage-teal
> connected by a warm ochre leather drive belt and tiny brass chain, powering a glowing warm golden
> paper lightbulb on the right. Faint pegboard dots on the paper ground.

### Pokémon Memory (`memory`)

> A neat 3x2 fan of thick rounded cardstock memory cards on a tabletop: several face-down cards in
> cheerful terracotta-red with crisp white polka dots and a simple red-and-white split circle
> emblem, and two matched face-up cotton-paper cards revealing cute matching pocket-creature
> silhouettes in golden ochre and indigo with tiny celebratory sparkles between them.

### Wie is deze Pokémon? (`pokemon-quiz`)

> A playful guessing-game scene: a large dramatic deep-indigo cut-paper silhouette of a cute
> spiky-eared fantasy pocket creature centered on a glowing warm cream spotlight medallion,
> surrounded by floating golden ochre question marks and tiny geometric sparkles on cotton paper.

### Schaken (`chess-tutorial`)

> A perspective view of a charming wooden chessboard with warm cream (#f6efe0) and muted slate-blue
> (#8fa8c2) squares, featuring a friendly white wooden knight and rook facing a deep slate-ink king,
> with a bright golden ochre paper star glowing on a target square.

De veldkleuren komen overeen met `chessBoardOptions` in `libs/shared/lib/chess-board.ts`.

### Vlaggenreis (`flags`)

> A cheerful stylized cut-paper world globe and folded paper map in soft ocean sky-blue and
> botanical-green landmasses, surrounded by a gentle arc of tiny colorful fluttering paper pennants
> and national flags (Dutch tricolor, Swedish blue-yellow cross, Japanese sun, Brazilian diamond)
> plus a small brass compass rose.

### Bonjour ! (`french-listening`)

> A cozy Parisian children's picture-book vignette: a graceful miniature paper Eiffel Tower in
> craftsman indigo, a warm ochre butter croissant, a tiny terracotta beret, and soft sound-wave
> ripples radiating from a friendly indigo audio badge with musical notes.

### Letterpret (`letters`)

> A charming little wooden toy train in craftsman indigo, warm ochre, and botanical green chugging
> along a soft paper track, carrying big friendly wooden letter blocks (m, a, s, k) in its wagons
> with tiny puffs of cream paper steam and musical sound-wave arcs floating above.

### Vier op een Rij (`four-in-a-row`)

> A tactile upright wooden-and-cream tabletop board game frame with neat circular slots filled with
> craftsman indigo and warm terracotta-red game discs, showing a diagonal winning line of four
> glowing discs and one terracotta disc mid-drop from above.

### Ganzenbord (`ganzenbord`)

> A whimsical spiral tabletop board game path winding across parchment-cream paper with tiny
> charming illustrations of a bridge, a little stone well, and a botanical garden pond at the
> center, with two cheerful white paper geese wearing indigo and terracotta ribbons hopping along
> the spiral beside a pair of chunky cream wooden dice.

### Typepret (`typepret`)

> A sleek, friendly minimalist desktop keyboard seen from a gentle top-down angle, made of thick
> rounded cream paper keycaps with the middle home-row keys painted in soft pastel rainbow
> finger-zones (coral, apricot, sage, sky, lavender), and two keys (F and J) subtly highlighted in
> craftsman indigo with tiny glowing sparks rising above them. No UI chrome.

### Geheime Code (`geheime-code`)

> A charming cut-paper secret-code game on a warm ivory tabletop: a slightly tilted cream paper code
> card with a neat 2×5 grid of rounded paper tiles. Each tile holds one simple cut-paper pictogram —
> star, heart, key, boat, gift, book, carrot, bag, bell, moon — with a single plain standard Latin
> lowercase letter beneath it in deep warm ink. Below the card, a paper strip with four larger
> pictogram tiles (key, star, bell, moon) and four empty cream letter squares. A small indigo paper
> magnifying glass, a terracotta pencil, and a loop of indigo string rest beside the card, with a few
> tiny ochre paper stars. Only single letters as part of the code: no words, no sentences, no title,
> no UI chrome, no frame.

### Wie was het? (`wie-was-het`)

> A cozy top-down architectural floorplan of four pastel-tinted dollhouse rooms (sand kitchen, mint
> hallway, rose bedroom, lavender study) with tiny charming paper furniture (armchair, bed,
> bookshelf), a small golden birthday cake treasure in one room, and a playful wooden detective
> magnifying glass hovering over tiny dotted footprints.

## Een nieuwe thumbnail maken

1. Genereer de afbeelding met de stijlalinea hierboven plus de scène van het spel.
2. Bewaar de bron buiten de repository; alleen de verkleinde JPEG gaat mee.
3. Verklein, hernoem en schrijf weg:

   ```sh
   corepack pnpm run thumbnails --input /pad/naar/je/afbeeldingen
   ```

   Het script maakt 800 × 500 JPEG's, voegt de contenthash toe en ruimt oudere bestanden van
   dezelfde slug op. Het print de paden die je in `gameCatalog` plakt.

4. Werk `libs/entities/game/model/game-catalog.ts` bij met het nieuwe pad.
5. Controleer de set:

   ```sh
   corepack pnpm run thumbnails:check
   ```

   De check zit ook in `pnpm run quality` en faalt op een ontbrekend bestand, een verkeerde
   afmeting, een hash die niet meer klopt of een thumbnail zonder game.
