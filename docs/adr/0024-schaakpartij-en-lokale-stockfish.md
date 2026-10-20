# ADR 0024: Schaakpartij, hub en lokale Stockfish

## Status

Geaccepteerd — 20 oktober 2026.

## Context

De schaaktutorial en de schaakpuzzels stonden los van elkaar: `/schaken` opende
direct de tutorial en puzzels hadden een eigen route (`/puzzels`). Kinderen
konden wel leren schaken, maar geen partij spelen. Een partij tegen een echte
engine betekent normaal een server of een externe dienst; beide zijn in deze
publieke, statische app niet toegestaan.

De wensen waren:

- samen spelen op één toestel, om de beurt (pass-and-play);
- tegen een computer spelen, met een kindvriendelijk niveau;
- een duidelijke avatar en naam per speler en een zichtbare beurtwissel;
- geen account, geen backend en geen externe requests;
- dezelfde mobiele en tablet-eisen als de rest van de app (390 px en 1024 px,
  veilige marges en touch-targets van minimaal 44 px).

## Beslissing

### Hub op `/schaken`

`/schaken` is nu een hub met drie kaarten:

| Route             | Scherm                               |
| ----------------- | ------------------------------------ |
| `/schaken/les`    | de bestaande schaaktutorial          |
| `/schaken/partij` | de nieuwe partij (computer of samen) |
| `/puzzels`        | de bestaande schaakpuzzels           |

De tutorial verhuist naar `/schaken/les`; oude links naar `/schaken` komen op de
hub uit. De puzzelroute blijft ongewijzigd, zodat bestaande voortgang en links
blijven werken. De catalogus op de homepage noemt het spel nu “Schaken” in
plaats van “Schaakles”.

### Twee modi: samen en computer

- **Samen spelen** is pass-and-play op hetzelfde scherm. Beide spelers hebben
  een emoji-avatar en een optionele lokale naam. Het bord draait niet automatisch
  en de statusregel noemt steeds wie aan zet is.
- **Computer** gebruikt de gekozen moeilijkheid (`makkelijk`, `middel`,
  `moeilijk`) en de gekozen kleur. De engine denkt kort na; tijdens het denken
  staat de beurt op “Denkt…” en is invoer geblokkeerd.

De FEN is de enige bron van waarheid. Elke zet, undo en herlaadactie maakt een
nieuwe `Chess`-instantie, zodat React StrictMode of een dubbele render nooit een
zet dubbel uitvoert. De zettenlijst bewaart SAN, slaande stukken en promoties.

### Stockfish lokaal, niet via een dienst

We gebruiken `stockfish.js@10.0.2` als lokale dependency. De wasm-build draait in
een Web Worker en communiceert via het UCI-protocol. Er gaat geen zet, stelling
of gebruikersgegeven naar buiten.

De bestanden worden bij het starten van Vite uit `node_modules/stockfish.js`
gekopieerd naar `apps/games/public/stockfish/`:

- `stockfish.wasm.js` (worker + glue)
- `stockfish.wasm`
- `Copying.txt`

Die map is gitignored. De reden is de repositoryregel dat alleen TypeScript in
de repository staat: `.js`-assets zijn verboden. De Vite-plugin
`tools/stockfish-assets.ts` kopieert daarom de bestanden vóór dev en build uit de
gepinde dependency. De build bevat ze daarna gewoon in `dist/stockfish/`.

De asm.js-variant (`stockfish.js`) wordt niet gekopieerd: die is groot en alleen
een terugvaloptie voor browsers zonder WebAssembly. Als de worker niet start,
bijvoorbeeld door een browser of beleid die wasm weigert, kiest een kleine
lokale noodbot (`pickFallbackMove`) uit de drie beste zetten. Zo loopt een partij
altijd door; de statusregel meldt het alleen als er echt geen zet gevonden is.

### CSP

De CSP in `apps/games/public/_headers` is gericht uitgebreid:

- `script-src 'self' 'wasm-unsafe-eval'` — WebAssembly-compilatie toestaan zonder
  het brede `'unsafe-eval'`;
- `connect-src 'self'` — de wasm-module mag van de eigen origin worden geladen.

Er zijn geen externe hosts, CDN's of trackers toegevoegd. `default-src 'self'`
blijft staan en de worker wordt van de eigen origin geladen. De stockfish-assets
krijgen een lange cache-header, net als de gehashte app-assets.

### Avatars, namen en opslag

Avatars zijn emoji uit een vaste, lokale lijst. Namen zijn optioneel en lokaal.
De partij, instellingen, avatars en namen worden bewaard onder
`games.chess.v1` in `localStorage`; er is geen account, sync of server. Bij het
laden valideert de app de opgeslagen FEN, zettenlijst, spelers en promoties en
valt ze bij twijfel terug op een schone setup. Een onafgemaakte partij gaat na
een herlaadbeurt verder; een afgeronde partij opent in de setup.

## Gevolgen

- De tutorial-URL is nu `/schaken/les`; de homepage linkt naar de hub.
- De app bevat ongeveer 0,6 MB aan Stockfish-wasm plus de glue. Dat is alleen
  nodig zodra iemand tegen de computer speelt; de hub, les en puzzels laden de
  engine niet.
- De engine is GPL-3.0. De dependency en de bijgeleverde `Copying.txt` worden
  ongewijzigd meegeleverd. De bron van deze build staat in het npm-pakket
  `stockfish.js@10.0.2` en in de bijbehorende upstream-repository.
- De kwaliteitsgate controleert de nieuwe slices, de publieke API's en de
  laaggrenzen. De engine-wrapper en de noodbot zijn los getest, zonder echte
  wasm of netwerk.
- Een toekomstige engine-upgrade is een dependency-update plus een controle van
  de worker-URL, de UCI-uitvoer en de CSP.
