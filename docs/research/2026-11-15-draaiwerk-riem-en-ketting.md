# Draaiwerk: van een stippellijn naar een echte riem en ketting

- **Datum:** 2026-11-15
- **Status:** Voorstel. De huidige implementatie op `feat/draaiwerk` is gelezen; er is nog niets aan de app veranderd.
- **Aanleiding:** Op het bord leest de "open riem" als een kapsule met een streeplijn erin. De wielen draaien, maar de band lijkt daar los van te staan. Bij het slepen verplaatst een icoontje uit de bak zich, niet de band zelf. De vraag: welke libraries of SVG-animaties maken hier een echte riem of ketting van?
- **Vraag:** Hoe laten we de band en de ketting fysisch kloppend bewegen, en hoe voelt het plaatsen als het opspannen van een echte band in plaats van het neerzetten van een token?
- **Kader:** [AGENTS.md](../../AGENTS.md) (bibliotheken eerst, geen backend, geen externe requests), de [CSP](../../apps/games/public/_headers), het [design system](../design-system.md), [ADR 0031](../adr/0031-draaiwerk.md) en de [researchnotitie van 2026-11-14](2026-11-14-draaiwerk.md).

## Kort advies

Het probleem is niet een ontbrekende library. Er zijn drie concrete oorzaken:

1. **De band heeft geen eigen snelheid of richting in het model.** `ConnectionPose` bevat alleen `path` en `active` (`libs/entities/gear/model/types.ts:93`). De UI kan dus niet weten hoe snel de band moet lopen. De tandwielen krijgen hun tempo uit `speed` (`libs/features/draaiwerk/ui/gear-art.tsx:102`), maar de band krijgt een vaste animatie van 1800 ms (`apps/games/src/app/styles/index.css:675`). Twee klokken die niets met elkaar te maken hebben.
2. **De ketting is geen ketting, maar dezelfde lijn met een andere dash.** `ConnectionBand` tekent voor beide soorten twee streken: een dikke band en een dunne streeplijn (`gear-art.tsx:367-396`). Voor een ketting is dat `strokeDasharray="1.5 6"`. Er zijn geen schakels, geen rollen, geen afwisseling van binnen- en buitenplaat, en de lijn ligt op de tandtoppen in plaats van op de steekcirkel.
3. **De interactie sleept een icoontje, niet de band.** De `DragOverlay` toont `TrayArt` (`libs/features/draaiwerk/ui/draaiwerk-play.tsx:241-247`). Een losse riem is een perfecte cirkel met een kort staartje en een knop (`libs/features/draaiwerk/ui/draaiwerk-board.tsx:248-349`). Er is geen voorbeeld van de band naar het tweede wiel, geen spanning, geen klik en geen overgang: bij de tweede tik springt de losse lus in één frame naar de kapsule.

**Advies:** los eerst het model en de tekenwijze op, zonder nieuwe dependency. Geef `ConnectionPose` een signed oppervlaktesnelheid, teken de riem als twee losse banden tussen de poelies in plaats van één kapsule, en teken de ketting als schakels op de steekcirkel. Maak daarna de sleepinteractie een echte spanbeweging: de band volgt de vinger, rekt om de tweede poelie en klikt vast met een korte morph en haptiek. Voor de schakels is SMIL (`<animateMotion>`) de goedkoopste betrouwbare route; die werkt in Chrome 19+, Safari 6+ en Firefox 4+ en heeft geen library nodig. Voeg `svg-path-commander` of `d3-interpolate-path` pas toe als blijkt dat de virtuele-poelie-aanpak niet genoeg is.

Deze aanpak is niet onbewezen: **Beltz** (MIT, Unity, 120 levels) doet precies dit met twee banden, een procedurele groeftextuur en een open↔gekruist-morph met een korte terugslag. De broncode is klein en leesbaar; zie [Eerdere oplossingen](#eerdere-oplossingen-en-wat-ze-opleveren).

## Wat er nu precies staat

### De band

`connectionPath` rekent de juiste open-riem- of gekruiste-riem-tangenten uit (`libs/entities/gear/model/geometry.ts:215-275`). De offset is 6 voor een riem en 4 voor een ketting (`geometry.ts:29-32`). Met `gearRadius(size) = size × 28` als steekstraal en tandtoppen op steekstraal + 4 (module 4):

| Ding    | Ligt op                   | Banddikte | Wat je ziet                                                                                                               |
| ------- | ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Riem    | steekstraal + 6           | 7         | Binnenrand op steekstraal + 2, dus 2 px buiten de tandtop; de streeplijn loopt op de tandtoppen. De band lijkt te zweven. |
| Ketting | steekstraal + 4 = tandtop | 5         | De band doorsnijdt de tandtoppen; de tanden steken door de ketting heen.                                                  |

Beide verbindingen worden vóór de tandwielen getekend (`draaiwerk-board.tsx:487-525`). Dat is voor een riem goed — de band loopt om de poelie en verdwijnt achter de schijf — maar alleen als de band precies op de tandtop aansluit. Nu steekt de dunne streeplijn tussen de tanden door, waardoor het geheel als een achtergrondkapsule leest.

De animatie zelf: de streeplijn verschuift met 24 board-eenheden per 1800 ms, dus 13,3 eenheden per seconde. De motor doet één omwenteling in 6 seconden (`gear-art.tsx:102-103`). De omtreksnelheid is dus:

| Maat | Steekstraal | Omtreksnelheid bij 1× | Huidige band                       |
| ---- | ----------- | --------------------- | ---------------------------------- |
| 1    | 28          | 29,3 eenheden/s       | 13,3 eenheden/s (2,2× te langzaam) |
| 2    | 56          | 58,6 eenheden/s       | 13,3 eenheden/s (4,4× te langzaam) |
| 3    | 84          | 87,9 eenheden/s       | 13,3 eenheden/s (6,6× te langzaam) |

Bovendien wordt `animation-direction` nooit omgekeerd. Een gekruiste riem of een omgekeerde motor beweegt dus altijd dezelfde kant op. Bij de ketting is de dashcyclus 7,5 eenheden, terwijl de keyframe naar −24 gaat: dat is 3,2 cycli, dus de ketting maakt elke 1,8 seconden een zichtbare sprong.

### De ketting

De ketting deelt het tekenpad met de riem. Er is geen onderscheid in vorm, laag, snelheid of uitlijning. Een echte ketting bestaat uit afwisselende binnen- en buitenplaten met rollen; die rollen horen op de steekcirkel te liggen, niet op de tandtoppen. Zonder die vorm leest de ketting als een gestippelde lijn, hoe goed de animatie ook loopt.

### De interactie

De route is: kies "Open riem" in de bak, tik op wiel A, de band hangt als cirkel om A, tik op wiel B, de verbinding verschijnt. Dat is bewust twee stappen (ADR 0031, addendum). Maar tussen stap 2 en 3 gebeurt visueel niets:

- De drag-overlay is een klein icoon uit de bak, geen band in bordcoördinaten.
- De losse band is een cirkel plus een kwart-commandostreep; er is geen zwaartekracht, geen doorhang, geen beweging als de vinger verschuift.
- Bij de tweede tik wordt de plaatsing in één keer vervangen door een gesloten pad. Geen morph, geen geluid, geen haptiek. `playSound("tap")` klinkt alleen bij het begin van de sleep (`draaiwerk-play.tsx:92`).
- De hint "Trek de riem nu naar een ander tandwiel" staat er wel, maar de band zelf nodigt niet uit.

Dat is de "geen echte ketting"-ervaring: het is een puzzle-token dat naar een geldige plek springt, geen materiaal dat je vasthoudt en opspant.

## Hoe een echte band beweegt

Twee natuurwetten zijn genoeg voor een overtuigende animatie, en ze zijn deterministic:

1. **Het loopvlak heeft één snelheid.** Voor een riem of ketting is de lineaire snelheid van het loopvlak overal gelijk: `v = ω₁·r₁ = ω₂·r₂`. De twee poelies draaien dus verschillend snel, maar de band niet. Voor de animatie betekent dat: één snelheid voor de hele lus, afgeleid van de poelie waar de band op aangrijpt.
2. **Op een boog draait de textuur mee met de raaklijn.** Een streeplijn langs een gesloten pad doet dat automatisch: de dash gaat om de poelie heen en keert op de onderste run vanzelf de andere kant op. Daarom is een dash-op-pad geen slechte benadering voor een riem. Teken je de band als twee losse banden, dan moet je de tweede band van B naar A tekenen (of de dashrichting omkeren), anders schuiven beide banden dezelfde kant op. Het probleem is dus niet het principe, maar de snelheid, de plaats en het uiterlijk.

Voor een ketting geldt hetzelfde, met één extra eis: de schakels zijn starre platen. Die moeten met de raaklijn meedraaien en op de steekcirkel liggen. Een dash kan dat niet; een lijst losse schakels wel.

### Wat dit betekent voor het model

`ConnectionPose` heeft één extra getal nodig, en verder niets:

```ts
export interface ConnectionPose {
  key: string;
  kind: "open-belt" | "crossed-belt" | "chain";
  fromKey: string;
  toKey: string;
  path: string;
  active: boolean;
  /** Signed surface speed in board units per second. */
  surfaceSpeed: number;
}
```

In `drive()` is dat één regel, want de hoeksnelheid van de `from`-poelie is al bekend:

```ts
const fromRotor = rotors.get(from.key);
const angular = (Math.PI * 2) / 6; // de motor doet 6 s over een omwenteling
const surfaceSpeed = (fromRotor?.speed ?? 0) * angular * gearRadius(from.size);
```

Het tekenen wordt dan:

```tsx
const cycle = kind === "chain" ? chainPitch : beltTreadPitch;
const duration = cycle / Math.max(1, Math.abs(surfaceSpeed));
const reverse = surfaceSpeed < 0;
```

`duration` en `animation-direction` gaan als CSS-variabele naar de band. Geen React per frame, geen nieuwe library.

## Eerdere oplossingen en wat ze opleveren

Er is inderdaad al iemand die dit heeft gemaakt. De meest bruikbare bron is een kleine, open-source puzzelgame die letterlijk over riemen en poelies gaat.

### Beltz (MIT, Unity, 120 levels)

[`Carapacik/Beltz`](https://github.com/Carapacik/Beltz) is een puzzelgame met één regel: elke riem moet kloppen, dus open of gekruist. De repo is MIT-gelicenseerd, heeft 80 sterren en is in oktober 2026 bijgewerkt (commit `9c54e1f`). De broncode is geen Unity-rommel: `BeltView.cs` is ongeveer 120 regels en bevat de hele riem.

Wat daar staat, en wat wij direct kunnen overnemen:

- **Twee rechte banden, geen kapsule.** `BeltView` bouwt twee ribbons tussen de twee poeliemiddens, met een offset van `radius * 0.97`. De uiteinden verdwijnen achter de poelieschijf (sorteerlaag 2 voor de riem, 5 voor de poelie). Je ziet dus geen lus om de wielen heen, maar twee banden die bij de velg beginnen en eindigen. Dat is precies waarom de riem in onze screenshot als een lege racebaan leest: wij tekenen de hele omtrek, inclusief de bochten, en de bochten zijn het minst overtuigende deel.
- **Een band met een donkere rand en een bewegende groef.** De shader mengt een basiskleur met een donkere rand op `uv.y` en een groef op `cos((uv.x - _Phase) * 34)`. Dat is geen texture en geen dash: het is een procedureel loopvlak. In SVG kan hetzelfde met een dikke streek, een donkere randstreek en een dash met grove tanden. Belangrijker dan de techniek is de opbouw: **band, rand en profiel zijn drie lagen**, geen stippellijn in een vlakke kapsule.
- **Open ↔ gekruist morpht in 0,17 s.** `crossing` gaat met `SmoothDamp` van 0 naar 1; de vier tangentpunten worden geïnterpoleerd tussen de open en de gekruiste stand. Er is dus geen path-library nodig: de vorm is een paar getallen. Bij de overgang krijgt de band een `kick` die exponentieel uitdempt en als een golf over de band loopt. Dat is de "klik" die onze tweede tik mist.
- **De hele lus is aanraakbaar.** `Distance(point)` rekent de afstand tot de bandbanen én tot het hele inwendige van de lus, met een marge. Een kind hoeft niet op de 6 px brede band te mikken.
- **Tap en drag naast elkaar.** `BoardInput` gebruikt een sleepdrempel van `max(20 px, 1,8% van de schermhoogte)`: een korte beweging is een tap, een langere is een drag. Onze `wasDragging`-boolean is grover en kan een echte tik als drag laten vallen.
- **Richtingpijlen in de leegste sector.** `BoardView` kiest van acht sectoren de sector waar geen riem ligt, en zet de pijl daar. Op een vol bord voorkomen ze zo dat pijlen en banden over elkaar heen vallen.
- **Geen physics, geen allocation per frame.** Een vaste mesh, 28 samples per band, en alleen de vertices worden bijgewerkt. Geen Rigidbody, geen colliders. Dat is exact dezelfde filosofie als onze deterministische graaf.

Wat Beltz **niet** doet, en wij wel moeten doen:

- Beltz draait alle poelies met dezelfde hoeksnelheid (±64°/s) en scrollt de band met een vaste `0.48` per seconde. Dat is genoeg omdat de puzzel alleen over richting gaat. Bij Draaiwerk is snelheid juist een leerdoel (0,5×, 1×, 2×), dus daar moet de band wél de verhouding volgen. Dat is geen extra werk: de `speed` van de `from`-poelie staat al in het model.
- Beltz heeft geen ketting. Voor de ketting blijft de schakelaanpak nodig.

De screenshots in de repo laten het resultaat zien: crème banden met een donkere rand, zwarte poelies met een lichte ring, en richtingpijlen buiten de poelies. De banden lezen direct als materiaal, ook al zijn het maar twee rechte lijnen.

### mechanism-lab (MIT)

[`jacobplee/mechanism-lab`](https://github.com/jacobplee/mechanism-lab) is al de bron van onze tandwielgeometrie. De repo bevat ook een open-riem-model dat we nog niet volledig gebruiken:

- `src/belt.js` rekent de twee uitwendige raaklijnen uit en geeft `pose(phi1) = { phi1, phi2: phi1 * r1 / r2 }`. Dat is de wiskunde achter "gelijke oppervlaktesnelheid".
- De demo tekent de band als **de ruimte tussen twee open-riem-paden** met stralen `r ± w`, niet als één streek op de middellijn. Daarmee heeft de band een echte, constante dikte.
- De code waarschuwt expliciet: "offsetting the centre line by a radius is not [exact]". Onze `BELT_OFFSET` is zo'n offset. Voor een spel is dat prima, maar het verklaart waarom de band niet mooi op de tandtop aansluit.
- De checks controleren dat de raakpunten op beide velgen liggen en dat de poelies met gelijke oppervlaktesnelheid draaien. Die eigenschappen horen in onze pure tests.

### gearworks (MIT)

[`Artem1bar/gearworks`](https://github.com/Artem1bar/gearworks) is een kleine, MIT-gelicenseerde solver met fasevergrendelde tandwielen en jam-detectie. Ik heb de bron doorzocht: er zit **geen** riem, ketting of poelie in. Het blijft nuttig als referentie voor fase en vastlopen, niet voor de band.

### Sprocketry (commercieel)

De webversie op [gameeduhub](https://gameeduhub.com/sprocketry.html) is een canvas-spel met alleen tandwielen; in die build zitten geen riemen of kettingen. Het is dus geen bron voor de band, maar wel een goede referentie voor de rustige pegboard-opbouw, de donkere motor en de richtingpijlen.

### Crazy Gears (commercieel)

[Crazy Gears](https://apps.apple.com/us/app/crazy-gears/id967327312) is de bekendste referentie voor kettingen, katrollen en gewichten in een kinderapp. Er is geen broncode, maar de interactie is leerzaam: onderdelen voelen als materiaal, en de machine komt pas tot leven als de ketting gesloten is. Dit is het gevoel dat we met de morph en de terugslag proberen te benaderen.

### Ye Old Machines (GPL-3.0, Phaser)

[`jefbt/ye-old-machines`](https://github.com/jefbt/ye-old-machines) is een game-jamspel met dezelfde puzzel: tandwielen van een input naar een output verbinden op een pegboard. De "chain" en "drive belt" zijn daar twee statische rechthoeken (`this.add.rectangle`), zonder animatie of textuur. De les is tweeledig: het puzzelconcept werkt zonder mooie band, maar de band is dan ook meteen het zwakste deel van het beeld. De code is GPL-3.0; alleen lezen, niets overnemen.

### streamin/belt-geometry-solver (MIT, Python)

[`streamin/belt-geometry-solver`](https://github.com/streamin/belt-geometry-solver) rekent riempaden, wikkelhoeken, raakpunten en lengtes uit voor **meerdere** poelies, inclusief open en gekruist. Voor twee poelies hebben we het niet nodig, maar het is de referentie als er ooit een serpentine-riem of een derde poelie in een level komt.

### Godot PathFollow2D en Codrops

Twee conceptuele referenties voor de ketting:

- [Godot `PathFollow2D`](https://docs.godotengine.org/en/stable/classes/class_pathfollow2d.html) is de engine-variant van wat wij met SMIL doen: zet N objecten op vaste afstanden langs een pad en schuif de offset. Het bevestigt dat "N schakels op gelijke booglengte" de standaardoplossing is, niet een eigen vondst.
- [Codrops: Animate Anything Along an SVG Path](https://tympanus.net/codrops/2022/01/19/animate-anything-along-an-svg-path/) laat de `getPointAtLength()`-route zien. Dat is het alternatief als SMIL niet bevalt: één keer per frame of bij elke wijziging de punten samplen en de schakels met transforms plaatsen.

### Conveyor belts in games

Het scrollen van een loopvlak is in games een standaardidee: Unreal, Unity en de Source-engine scrollen een texture over een band met een UV-offset. In SVG is `stroke-dashoffset` daar de directe vertaling van. Het is dus niet vreemd dat onze dash-aanpak in de verte goed voelt; hij is alleen niet afgemaakt.

### Wat ik zou overnemen

| Idee                                                      | Bron                | Effect                                        | Kosten            |
| --------------------------------------------------------- | ------------------- | --------------------------------------------- | ----------------- |
| Twee banden tussen de poelies, uiteinden achter de wielen | Beltz               | Geen lege kapsule meer; de band raakt de velg | Klein             |
| Donkere rand + bewegende groef in drie lagen              | Beltz               | Leest als rubber, niet als stippellijn        | Klein             |
| Open↔gekruist morph met terugslag                         | Beltz               | De band reageert op de keuze van het kind     | Klein, ±30 regels |
| Hele lus als aanraakvlak                                  | Beltz               | Kind hoeft niet op 6 px te mikken             | Klein             |
| Tapdrempel in px                                          | Beltz               | Tik en sleep gaan niet meer door elkaar       | Klein             |
| Richtingpijl in de leegste sector                         | Beltz               | Minder overlap op volle borden                | Klein             |
| `phi2 = phi1 * r1 / r2`                                   | mechanism-lab       | Band en wielen lopen echt synchroon           | Klein             |
| Band als ruimte tussen twee raaklijnen                    | mechanism-lab       | Constante banddikte, geen offset-fout         | Middel            |
| N schakels op gelijke booglengte                          | Godot/SMIL          | Echte ketting in plaats van dash              | Middel            |
| Geen physics, vaste geometrie                             | Beltz/mechanism-lab | Determinisme en tests blijven intact          | Geen              |

## Drie wegen voor het tekenen

### A. Twee banden met loopvlak, ketting met een dubbele dash (geen dependency)

Voor de riem, naar het voorbeeld van Beltz:

- teken **twee losse banden** tussen de poelies, niet één gesloten kapsule. Elk uiteinde loopt tot achter de poelieschijf en wordt door het tandwiel bedekt;
- de bandlijn ligt op `tandtop + halve banddikte`, dus `gearRadius + 4 + 4.5` bij een band van 9. Omdat de band achter het wiel ligt, lijkt hij precies op de velg aan te sluiten;
- drie streken per band: een donkere buitenrand, een lichte band, en een streeplijn met grove tanden. Zo ontstaat een rubberen loopvlak in plaats van een lijn;
- de bovenste band loopt van A naar B, de onderste van B naar A. Daardoor beweegt de dash op de onderste band de andere kant op, net als bij een echte band. Teken ze niet allebei van A naar B, want dan schuiven beide banden dezelfde kant op;
- `stroke-dashoffset` met de snelheid uit het model, en `animation-direction: reverse` bij een negatieve snelheid.

Voor de ketting:

- twee streken over hetzelfde pad: een brede plaatdash (`stroke-width 5`, dash `7 2`) en een smalle rollendash (`stroke-width 2`, dash `2 7`), in een donkerdere kleur;
- de ketting boven de tandwielen tekenen, op de steekcirkel, zodat de schakels op de sprocket liggen;
- dezelfde snelheid en richting als de band.

Dit is de kleinste stap en lost het meeste op. Op 390 px is een schakel ongeveer 4–6 CSS-px; twee afwisselende dashritmes lezen daar waarschijnlijk beter dan echte plaatjes. Op 1024 px wordt het verschil zichtbaar en wil je meer.

**Inspanning:** ongeveer een dag, inclusief tunen en tests. **Risico:** laag. **Nadeel:** de ketting blijft een textuur, geen echte schakels.

### A2. Open ↔ gekruist morph en terugslag (geen dependency)

Beltz laat zien dat de overgang tussen open en gekruist geen path-library nodig heeft. De vier tangentpunten zijn een functie van één getal `crossing`:

```ts
const start = lerp(openStart, crossStart, crossing);
const end = lerp(openEnd, crossEnd, crossing);
```

Zet `crossing` met een korte ease (150–200 ms) van 0 naar 1 en de band kruist zichtbaar. Voeg een `kick` toe die exponentieel uitdempt en als een golf over de band loopt:

```ts
const bow =
  Math.sin(t * Math.PI) *
  (Math.sin(crossing * Math.PI) * 0.24 + kick * Math.sin(t * Math.PI * 3 + kick * 16));
```

Dat is de "klik" die nu ontbreekt. Dezelfde parameterisering kun je gebruiken voor de virtuele poelie tijdens het slepen: je hoeft alleen de tweede poelie te verplaatsen, niet het pad te morphen. Geen `d3-interpolate-path`, geen `flubber`, geen GSAP.

**Inspanning:** ongeveer een halve dag boven op A. **Risico:** laag. **Winst:** dit is het verschil tussen "het staat er opeens" en "ik heb het vastgeklikt".

### B. Echte schakels met SMIL (geen dependency)

Laat elke schakel hetzelfde pad volgen met `<animateMotion>`:

```tsx
const length = connectionLength; // eenmalig uit de segmenten, niet per frame
const pitch = 12.5; // ongeveer de kettingsteek
const count = Math.max(8, Math.round(length / pitch));
const loop = length / Math.abs(connection.surfaceSpeed);

{
  Array.from({ length: count }, (_, index) => (
    <g key={index}>
      <animateMotion
        begin={`${-(index * (length / count)) / Math.abs(connection.surfaceSpeed)}s`}
        dur={`${loop}s`}
        path={connection.path}
        repeatCount="indefinite"
        rotate="auto"
      />
      <ChainLink outer={index % 2 === 0} />
    </g>
  ));
}
```

Dit is precies waarom SMIL hier zo goed past:

- **Geen meetwerk per frame.** De browser rekent positie en raaklijn uit. `begin` met een negatieve vertraging zet de schakels meteen op de juiste afstand; gelijke tijdstappen betekenen gelijke booglengte, omdat de snelheid constant is.
- **Geen library.** `<animateMotion>` werkt in Chrome sinds 19, Safari sinds 6 en Firefox sinds 4 (MDN browser-compat-data). Dat is ouder en breder dan `offset-path`.
- **`rotate="auto"`** laat elke schakel met de raaklijn meedraaien, ook om de poelie.
- **De phase klopt vanzelf.** De schakels blijven op het pad als de wielen veranderen, zolang `dur` en `path` opnieuw worden berekend.

Twee nadelen, beide oplosbaar:

- **SMIL kent geen `prefers-reduced-motion`.** Render de `<animateMotion>` daarom alleen als beweging is toegestaan. `motion` (al in de repo) exporteert `useReducedMotion`; gebruik dat, of een kleine `matchMedia`-hook. Toon in de stille stand een statische ketting plus richtingpijlen.
- **SMIL is niet gecomponeerd.** Bij 30–60 schakels per ketting kan dit op een oude tablet main-threadwerk kosten. Meet het op 390 px en 1024 px met twee kettingen. Als het te zwaar is: val terug op A, of gebruik per schakel een CSS-animatie met `offset-path` en `offset-rotate: auto` (Chrome 55+, Safari 15.4/16+, Firefox 72+). Verifieer `offset-path` op SVG-children wel eerst in Safari; SMIL is op iOS de veiligere keuze.

**Inspanning:** ongeveer twee dagen. **Risico:** middel (prestaties en reduced-motion). **Winst:** dit is de enige route waarbij een kind ziet dat de schakels echt om het wiel lopen.

### C. Een path-library voor morphing en meten

Alleen nodig als we verder gaan dan B:

| Kandidaat                      | Stand                                                                                          | Wat het oplost                                                   | Beoordeling                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `svg-path-commander`           | 2.3.3, MIT, september 2026, TypeScript, ±1,4 MB unpacked, één dependency (`@thednp/dommatrix`) | lengte, punt op lengte, raaklijn, segmenten, omkeren, transforms | **Bruikbaar** als we het pad als meetobject nodig hebben. Voor B niet nodig: de segmenten komen al uit `geometry.ts`.           |
| `svg-path-properties`          | 2.2.0, ISC, oktober 2026, TypeScript, 65 kB, geen dependencies                                 | alleen lengte en punt op lengte                                  | Lichter alternatief voor meten. Zelfde opmerking: nu niet nodig.                                                                |
| `d3-interpolate-path`          | 2.3.0, BSD-3, 2022, geen dependencies, geen eigen typen                                        | morph tussen twee `d`-strings met verschillende commando's       | **Niet nodig** met de virtuele-poelie-aanpak hieronder. Alleen als we twee topologisch verschillende paden echt moeten morphen. |
| `flubber`                      | 0.4.2, MIT, 2022, brengt `d3-array`, `earcut`, `topojson-client` mee                           | vorminterpolatie                                                 | Afgevallen: te veel en te oud voor één effect.                                                                                  |
| `gsap` + MotionPathPlugin      | 3.15.1, "no charge"-licentie, ±6 MB unpacked                                                   | schakels langs een pad met `autoRotate`                          | Afgevallen: geen OSI-licentie, groot, en het dupliceert `motion` en SMIL.                                                       |
| `@svgdotjs/svg.js`, `paper.js` | onderhouden, MIT                                                                               | volledige SVG-manipulatie                                        | Afgevallen: overkill; React bezit de DOM.                                                                                       |

De les: voor deze twee effecten is de geometrie al aanwezig. Een library toevoegen zou hier vooral een tweede waarheid over het pad introduceren.

## De interactie: van token naar opspannen

Dit is het belangrijkste deel, en het kan zonder dependency. De bestaande `motion`-dependency is genoeg.

### 1. Sleep de band, niet een icoon

Gebruik bij een losse band geen `TrayArt` in de `DragOverlay`, maar een spookpad in bordcoördinaten. Reken de pointerpositie om met dezelfde `getBoundingClientRect`- en `viewBox`-schaal als `handleBackgroundTap` (`draaiwerk-board.tsx:397-445`). Teken:

- de vaste poelie met twee banden die tot achter de velg lopen;
- een virtuele tweede poelie op de vinger, met de straal van het dichtstbijzijnde geldige wiel;
- de open-riem-tangenten tussen die twee cirkels, als twee losse banden.

`openBeltPath` rekent de raakpunten al uit; voor de twee banden gebruik je alleen de vier raakpunten en laat je de bogen weg. Zolang de virtuele poelie buiten de vaste poelie blijft, is het paar banden geldig. De band rekt dus letterlijk mee met de vinger. Dat is de "echte ketting"-sensatie: materiaal dat onder spanning staat, niet een plaatje dat verspringt.

### 2. Snappen en vastklikken

- Zweeft de virtuele poelie binnen `gearRadius + 16` van een geldig tandwiel, dan springt de virtuele poelie naar het echte middelpunt en licht het wiel op (de bestaande `data-drop-over` doet dat al).
- Laat de speler los: animeer de virtuele poelie in 150–200 ms naar het middelpunt met `motion` (`animate` met een lichte spring). Het pad verandert mee, dus de band lijkt zich om het wiel te trekken.
- Speel een korte ratel of klik. Voeg één `SoundName` toe, bijvoorbeeld `"ratchet"` met twee korte blokgolven, en gebruik `playHaptic("select")`. De bestaande `"tap"` bij het begin van de sleep is te zwak voor het moment dat de band vastklikt.
- Laat de band heel kort "spannen": een schaal van 1,01 → 1 op de bandgroep, of een kleine `stroke-width`-puls. Geen confetti; het is een mechanisch geluid, geen overwinning.

### 3. Laat de band zich vestigen

Bij de eerste drop om wiel A: teken geen perfecte cirkel, maar een lus met een korte doorhang onderaan, zoals een riem die je om een poelie legt en laat hangen. De bestaande `LooseBeltBand` heeft al een staartje; maak de lus een quadratic met een lichte zak en laat de staart met een klein beetje zwaartekracht meebewegen. Zo ziet een kind dat de band nog niet vastzit.

### 4. Tik op een geplaatste band om te wisselen

Beltz maakt van de band zelf een knop: een tik wisselt open en gekruist, met de morph en de terugslag erbij. Dat is een goede aanvulling op de bak. Een kind dat "Open riem" heeft geplaatst en eigenlijk een gekruiste riem nodig heeft, hoeft dan niet eerst het onderdeel te verwijderen en opnieuw te leggen. Het maakt de band ook tot een object dat je kunt onderzoeken, niet alleen een sticker die je plakt.

Let op de toegankelijkheid: de band krijgt een `role="button"`, een Nederlandse `aria-label` ("Riem, open; tik om te kruisen") en een toetsenbordroute. De hele lus is het aanraakvlak, niet alleen de streek.

### 5. Richting tonen met de band zelf

Als de band en de ketting de juiste snelheid en richting hebben, is de richting vanzelf zichtbaar. De verborgen `DirectionHint` (`index.css:645`) is dan niet nodig. Laat de pijl op het doel staan; laat de band het werk doen.

## Integratieschets

```text
libs/entities/gear/model/
  types.ts        ConnectionPose + surfaceSpeed
  geometry.ts     connectionPath blijft; voeg tangentPunten(crossing) en connectionLength toe
  rules.ts        surfaceSpeed berekenen uit de from-rotor

libs/features/draaiwerk/ui/
  gear-art.tsx    BeltRibbon (twee banden, drie lagen); ChainLayer met schakels
  draaiwerk-board.tsx
                  losse band met doorhang; sleepspook; chain boven de wielen
  draaiwerk-play.tsx
                  dragMove → virtuele poelie; drop → snap + morph + geluid + haptiek
  use-draaiwerk-store.ts
                  geen wijziging nodig; de verbinding blijft de waarheid

apps/games/src/app/styles/index.css
                  band- en kettingvariabelen; duration/direction uit de pose
```

De pure laag blijft leidend. `surfaceSpeed` is een afgeleide van `drive()`, dus tests kunnen hem controleren zonder DOM. De UI hoeft alleen nog de juiste CSS-variabele en het juiste pad te zetten.

### Wat ik zeker niet zou doen

- **Geen physics-engine.** De bestaande deterministische graaf is de kracht van dit spel. Een physics-engine maakt hints, tests en levelgaranties duur.
- **Geen `requestAnimationFrame`-lus in React voor de band.** De band heeft één constante snelheid; dat is CSS of SMIL, geen state per frame.
- **Geen `d`-morph met de hand.** Als er gemorpht moet worden, doe het via de virtuele poelie (drie getallen) in plaats van via padcommando's.
- **De ketting niet bovenop de tandwielen tekenen zonder de steekcirkel te gebruiken.** Dan gaan de schakels over de tanden zweven en wordt het een decoratieve rand.

## Verificatie

Wat ik heb gecontroleerd:

- **De huidige code gelezen** op `feat/draaiwerk` (commit `61d4066`): `geometry.ts`, `rules.ts`, `types.ts`, `gear-art.tsx`, `draaiwerk-board.tsx`, `draaiwerk-play.tsx`, `draaiwerk-store.ts`, de CSS en de tests.
- **Eerdere oplossingen gelezen.** Van [`Carapacik/Beltz`](https://github.com/Carapacik/Beltz) (MIT, commit `9c54e1f`) heb ik `BeltView.cs`, `BoardView.cs`, `BoardInput.cs`, `Puzzle.cs`, `Solver.cs` en `Shaders/Belt.shader` gelezen, plus de vier screenshots in de repo. Van [`jacobplee/mechanism-lab`](https://github.com/jacobplee/mechanism-lab) (MIT, commit `b32d384`) heb ik `src/belt.js` en de demo-scene gelezen. Van [`Artem1bar/gearworks`](https://github.com/Artem1bar/gearworks) heb ik bevestigd dat er geen riem of ketting in zit. Van [`jefbt/ye-old-machines`](https://github.com/jefbt/ye-old-machines) (GPL-3.0) heb ik alleen gekeken hoe de "chain" en "drive belt" zijn getekend; er is niets overgenomen.
- **De snelheden nagerekend.** De motor doet 6 s per omwenteling; de band doet 13,3 eenheden/s. Dat is bij maat 1, 2 en 3 respectievelijk 2,2×, 4,4× en 6,6× te langzaam. De kettingdash van 7,5 eenheden met een offset van −24 sluit niet op elkaar aan (3,2 cycli), dus die springt.
- **De laagorde en offsets nagerekend.** Riem: steekstraal + 6 met een band van 7 → binnenrand op steekstraal + 2, dus 2 px buiten de tandtop. Ketting: steekstraal + 4 = exact de tandtop met een band van 5 → de tanden steken door de ketting.
- **Versies en licenties opgezocht** in het npm-register op 2026-11-15: `svg-path-commander` 2.3.3 (MIT), `svg-path-properties` 2.2.0 (ISC), `d3-interpolate-path` 2.3.0 (BSD-3), `flubber` 0.4.2 (MIT), `gsap` 3.15.1 ("no charge"), `motion` 14.14.0 (MIT, in de repo op 14.9.0).
- **Browsersupport opgezocht** in MDN browser-compat-data: `animateMotion` Chrome 19 / Safari 6 / Firefox 4; `offset-path` Chrome 55 / Safari 15.4 / Firefox 72; `offset-distance` en `offset-rotate` Safari 16.
- **Niet gedaan:** de voorgestelde animatie in een echte browser renderen. Op deze machine ontbreken de systeembibliotheken voor de Playwright-browsers (`libglib-2.0.so.0`), dus er is geen screenshot van een proef. De eerste implementatiestap moet daarom een visuele proef op 390 px en 1024 px zijn, vóór de leveldata wordt aangepast. Beltz is ook niet gedraaid: dat is een Unity-project en de code is alleen gelezen.

### Testplan voor de implementatie

1. **Pure tests:** `surfaceSpeed` is `ω·r` en klopt voor open riem, gekruiste riem en ketting; de richting keert om bij een negatieve `from`-snelheid; de padlengte verandert niet als alleen de snelheid verandert.
2. **Componenttest:** na de tweede tik bestaat de verbinding, de band heeft een `data-speed` en de ketting heeft `count` schakels; bij `prefers-reduced-motion` staan er geen `animateMotion`-elementen in de DOM.
3. **Playwright op 390 × 844 en 1024 × 768:** twee screenshots met 400 ms ertussen; de bandtextuur moet in dezelfde richting zijn verschoven als de `from`-poelie draait. Voor de ketting: elk schakelcentrum ligt binnen 1 px van het pad (via `getCTM` en de padlengte).
4. **Prestaties:** met twee kettingen en 60 schakels meten op een oude tablet; als de frame rate zakt, terug naar route A of het aantal schakels verlagen.
5. **Toegankelijkheid:** de live-regio meldt "Riem gespannen" en "Ketting gesloten"; de richting is ook zonder beweging te zien.

## Risico's en open vragen

- **Schaal.** Op 390 px is een schakel 4–6 CSS-px. Route B kan daar drukker lezen dan route A. Misschien is de beste oplossing: route A op mobiel, route B vanaf een tabletbreedte. Dat is een container query of een gemeten bordbreedte, geen levelwijziging.
- **Prestaties van SMIL.** Niet gecomponeerd, dus mogelijk duur op een oude tablet. Dit is de belangrijkste aanname om te meten.
- **Safari en `offset-path` op SVG-children.** SMIL is op iOS de veilige route; `offset-path` is de fallback, niet andersom.
- **Kettingsteek en levelgeometrie.** Echte schakels op de steekcirkel vragen een steek die bij de tandwielen past. Voor de eerste versie is `count = round(length / pitch)` met een vaste pitch genoeg; de schakels zitten dan niet exact in elke tandval. Echte fasevergrendeling is een latere uitbreiding en raakt de leveldata.
- **Riem- en kettingbreedte.** De band moet dik genoeg zijn om textuur te dragen, maar niet zo dik dat hij op 390 px de tandwielen visueel opslokt. Dit is tunewerk met screenshots, geen modelvraag.
- **Geluid.** Een ratel toevoegen is een kleine uitbreiding van `sound.ts`, maar het moet niet als "fout" of als "gewonnen" klinken. Twee korte, droge klikken zijn beter dan de bestaande `match`-tune.
- **Open vraag:** wil je dat een ketting echt als een ketting leest (route B), of is een rustige, bewegende band met een duidelijk afwijkende textuur genoeg (route A)? Dat bepaalt of we aan SMIL beginnen.
- **Open vraag:** mag de band tijdens het slepen echt rekken, of moet hij strak blijven en alleen de virtuele poelie volgen? Rekken voelt levendiger, maar kan op een klein scherm rommelig worden.

## Addendum 2026-11-15: de band is een gesloten lus

De eerste implementatie tekende de riem als twee rechte banden, naar Beltz. In de browser op 390 px bleken de ronde eindkapjes van die banden zichtbaar aan de velg: de band las als twee losse balken met een knop, niet als een band om de poelie. Daarom is de definitieve tekening een **gesloten lus** op de tandtop:

- de band is een dunne lederen strook (5,8 px) met een donkere rand en een fijne bewegende groef;
- de lus ligt op de tandtop, zodat het tandwiel de binnenste helft bedekt en de band zichtbaar om de poelie sluit;
- een losse band is een 270°-wrap met één vrij uiteinde en een metalen oog, geen gesloten armband;
- de bak toont een lederen strap met een gesp in plaats van een pil met twee stippen.

De twee-bandengeometrie (`beltTangentRuns`, `ConnectionPose.runs`) blijft als pure meetkunde voor tests en een latere preview, maar de tekenlaag gebruikt `connection.path`. De ketting volgt dezelfde gesloten lus, met schakels op de steekcirkel.

## Addendum 2026-11-15: alleen kettingen

De riem is uit het spel verdwenen. Open en gekruiste verbindingen worden nu als kettingen getekend; de interne soorten `open-belt` en `crossed-belt` blijven de richting en overbrenging bepalen, maar de speler ziet en leest alleen nog een ketting. Dat maakt de mechanically identieke onderdelen visueel consistent en voorkomt dat een kind een riem en een ketting als twee verschillende dingen moet leren.

- De ketting ligt op de steekcirkel en wordt over de tandwielen getekend.
- Een losse ketting hangt als een grote lus over het tandwiel, met de greep onderaan.
- De tray toont een ketting in plaats van een lederen strap; de gekruiste variant toont twee kruisende kettingstrengen.
- De teksten, levelnamen en feedback zeggen nu "ketting" in plaats van "riem".

## Bronnen

- Huidige implementatie `feat/draaiwerk`, commit `61d4066`; de code staat lokaal in `libs/entities/gear/model/` en `libs/features/draaiwerk/`.
- [Carapacik/Beltz](https://github.com/Carapacik/Beltz) — MIT, commit `9c54e1f`. `Unity/BeltView.cs`, `BoardView.cs`, `BoardInput.cs`, `Shaders/Belt.shader`; de vier screenshots in `Screenshots/`.
- [mechanism-lab](https://github.com/jacobplee/mechanism-lab) — MIT, commit `b32d384`. `src/belt.js` en `demo/scenes.js`.
- [gearworks](https://github.com/Artem1bar/gearworks) — MIT, commit `3ed35cb`; gecontroleerd dat er geen riem of ketting in zit.
- [ye-old-machines](https://github.com/jefbt/ye-old-machines) — GPL-3.0, commit `571c122`; alleen gelezen, niet overgenomen.
- [belt-geometry-solver](https://github.com/streamin/belt-geometry-solver) — MIT, commit `cb2edef`; referentie voor meerdere poelies.
- [Godot PathFollow2D](https://docs.godotengine.org/en/stable/classes/class_pathfollow2d.html) — het "N objecten op gelijke afstand langs een pad"-patroon.
- [Codrops: Animate Anything Along an SVG Path](https://tympanus.net/codrops/2022/01/19/animate-anything-along-an-svg-path/) — de `getPointAtLength()`-route.
- [MDN: `<animateMotion>`](https://developer.mozilla.org/docs/Web/SVG/Reference/Element/animateMotion)
- [MDN: `offset-path`](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-path)
- [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) — geraadpleegd op 2026-11-15.
- [npm: svg-path-commander](https://www.npmjs.com/package/svg-path-commander) — 2.3.3, MIT.
- [npm: svg-path-properties](https://www.npmjs.com/package/svg-path-properties) — 2.2.0, ISC.
- [npm: d3-interpolate-path](https://www.npmjs.com/package/d3-interpolate-path) — 2.3.0, BSD-3.
- [npm: motion](https://www.npmjs.com/package/motion) — 14.14.0, MIT.
- [npm: gsap](https://www.npmjs.com/package/gsap) — 3.15.1, "no charge"-licentie.
- [Crazy Gears](https://apps.apple.com/us/app/crazy-gears/id967327312) — commerciële referentie voor kettingen en katrollen.
- [Sprocketry op gameeduhub](https://gameeduhub.com/sprocketry.html) — commerciële referentie voor het pegboard; de webversie heeft alleen tandwielen.
- [ADR 0031: Draaiwerk](../adr/0031-draaiwerk.md)
- [Research: Draaiwerk, 2026-11-14](2026-11-14-draaiwerk.md)
