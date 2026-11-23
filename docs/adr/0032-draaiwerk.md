# ADR 0032: Draaiwerk als deterministische tandwielpuzzel

- **Status:** Accepted
- **Datum:** 2026-11-14
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0004](0004-nx-monorepo.md), [ADR 0023](0023-voorlezen-met-tts.md)

## Context

Draaiwerk is een nieuw spel waarin een kind een vaste motor via tandwielen, een
liggende as, een riem, een gekruiste riem of een ketting met een vast doel
verbindt. De eerste opzet is onderzocht in
[`docs/research/2026-11-14-draaiwerk.md`](../research/2026-11-14-draaiwerk.md).

De voor de hand liggende aanpak is een physics-engine: tandwielen laten botsen
en de rotatie laten volgen. Dat is aantrekkelijk voor de animatie, maar slecht
voor een puzzel. Een physics-engine maakt de uitkomst afhankelijk van tijdstap,
massa en botsinstellingen. Hints, tests en herhaalbare levels worden daardoor
moeilijk. Bovendien kosten echte tandprofielen en fasevergrendeling veel eigen
meetkunde.

De alternatieven:

- **Physics-engine (planck.js, matter-js, Rapier).** Afgevallen: niet
  deterministisch genoeg, veel meer code en geen garantie dat een level exact
  oplosbaar is.
- **Kant-en-klare npm-tandwiellibrary.** Afgevallen: geen onderhouden pakket
  dat een pegboard-puzzel met fasecorrecte tandwielen oplost. `gears-react` is
  een applicatiekit, `svg-gear-generator` is klein en ononderhouden.
- **Alles zelf tekenen.** Afgevallen: de tanden moeten op elke maat in elkaar
  grijpen. Dat is meetkunde, geen illustratie.
- **MIT-referentie porten.** Gekozen: `mechanism-lab` heeft een kleine,
  geteste involute generator en faseformule.

## Beslissing

1. **Deterministisch graafmodel.** De motor, doelen en geplaatste onderdelen
   vormen één graaf. De verbindingstypes zijn `mesh`, `rigid`, `open-belt`,
   `crossed-belt` en `chain`. Elk type heeft een vaste richting en
   overbrengingsverhouding. Een conflict in richting of snelheid betekent
   "vastgelopen"; er is geen physics-engine.
2. **Involute tandwielen uit een MIT-bron.** `spurGear`, de faseformule uit
   `gearTrain` en de open-riem-tangenten zijn geport naar TypeScript in
   `libs/entities/gear/model/geometry.ts`. De bron is
   [`mechanism-lab`](https://github.com/jacobplee/mechanism-lab), MIT,
   copyright Jacob Lee. De volledige licentie staat in
   [`LICENSES/mechanism-lab-MIT.txt`](../../LICENSES/mechanism-lab-MIT.txt).
   De port gebruikt lage sampling, is gememoïseerd per tandenaantal en heeft
   geen runtime-dependency.
3. **Zestien levels, één nieuw ingrediënt per level.** Elk level heeft een
   uniek `introduces`-veld. Een test controleert dat geen twee levels hetzelfde
   ingrediënt introduceren, dat elk level valide is en dat de oplossing het
   level daadwerkelijk oplost. De eerste release bevat de hoofdstukken
   Tandwielen, Overbrengen, Snelheid en Kracht.
4. **Lokale voortgang, geen backend.** Voortgang staat in
   `localStorage` onder `games.draaiwerk.v1` en wordt genormaliseerd gelezen.
   Er zijn geen accounts, sync, analytics of externe requests.
5. **Tikken is de hoofdroute.** Een onderdeel kiezen en daarna een gaatje (of
   twee gaatjes voor een as, twee tandwielen voor een riem) is de primaire
   interactie. Slepen is niet nodig. Dit werkt betrouwbaar op een tablet en
   met toetsenbord.
6. **Landscape tablet is de primaire layout.** `GameShell` gebruikt `wide` en
   `fitViewport`; het bord staat links en de onderdelenbak rechts. Op portrait
   staat het bord boven en scrolt de bak horizontaal. Het bord schaalt via
   `viewBox` en `preserveAspectRatio`.
7. **Beweging is CSS, geen React per frame.** De tandwielrotor draait met een
   CSS-animatie; de fase zit op de buitenste SVG-groep. Riemen en kettingen
   bewegen met `stroke-dashoffset`. `prefers-reduced-motion` zet de beweging
   uit en toont een statische richting.
8. **Buiten deze release:** een compacte as op één gaatje, een rupsband, een
   tandheugel, een wormwiel en een planetair stelsel. Het model laat ruimte
   voor die uitbreidingen, maar er komt geen ongebruikte code in de release.

## Gevolgen

- **Licentie en onderhoud.** De involute- en fasecode is een port, geen
  dependency. De MIT-tekst en bronvermelding zijn verplicht. De port blijft
  onder eigen onderhoud; wijzigingen in de bron moeten handmatig worden
  gevolgd.
- **Tests.** De pure laag heeft tests voor meetkunde, richting, snelheid,
  as, riem, ketting, conflict, plaatsing en alle zestien levels. De UI heeft
  een componenttest en een Playwright-test op 1024 × 768 en 390 × 844.
- **CSP en privacy.** Alle meetkunde, iconen en animaties zijn lokaal. Er is
  geen nieuw netwerkverkeer, geen nieuw scriptdomein en geen nieuw opslagdoel
  buiten `localStorage`.
- **Prestaties.** Tandwielpaden worden één keer per maat berekend. De animatie
  draait op de compositor; React rendert niet per frame. Op grote borden zijn
  de hit-targets via de dichtstbijzijnde-hole-logica groter dan de zichtbare
  gaatjes.
- **Toegankelijkheid.** Gaatjes en tandwielen hebben labels en
  toetsenbordbediening. Richting wordt niet alleen met kleur aangegeven. De
  snelheidsmeter heeft een Nederlandse `aria-label`-waarde.
- **Scope.** De eerste release heeft zestien levels. De researchnotitie noemt
  daarnaast een compacte as, rupsband, tandheugel en combinatieniveaus; die
  zijn bewust nog niet gebouwd.

## Addendum 2026-11-15: wormas en tweetraps riem

De liggende as uit de eerste release is vervangen door een **wormas**: een
horizontale schroef die een wormwiel aandrijft. Dit supersedeert het punt
"een wormwiel" in beslissing 8. De motivering is UX: twee gaatjes kiezen en dan
nog een tweede tik was te veel werk voor één onderdeel.

- **Eén tik of drag.** De wormas wordt op één gaatje geplaatst. De app zoekt
  zelf de tweede plek, de hoek en de richting, op basis van wat er al op het
  bord staat. De speler hoeft dus nooit twee gaatjes aan te wijzen.
- **Eenrichtingsverkeer.** De schroef drijft het wiel aan, maar het wiel drijft
  de schroef niet terug. In de graaf is dat één `worm`-edge van schroef naar
  wiel met `speedFactor = direction * ratio`; de ratio is een echte vertraging
  (0,5 of 0,25). De auto-plaatsing kiest de kant die het best op de motor en
  het doel aansluit.
- **Visueel.** De schroef is een metalen staaf met schuine schroefdraden; het
  wiel is een bronzen tandwiel met schuine arcering. De tray toont dezelfde
  combinatie, zodat het onderdeel naast de losse tandwielen herkenbaar is.
- **Aangepaste levels.** De as-levels zijn herschreven: level 10 en 11 leren
  0,5× en 0,25× vertraging, level 12 laat de meter het verschil met de riem
  zien, level 13 gebruikt de riem voor een snelle lamp, level 14 de wormas voor
  een langzame lift en level 16 combineert een riem (1×) met een wormas (0,5×).
  De oude "snelle as" bestaat niet meer, omdat een worm nooit versnelt.
- **Riem in twee stappen.** Een riem of ketting hangt na de eerste drop los om
  één wiel. Een tweede drag aan het losse uiteinde, of een tweede tik op een
  ander wiel, maakt pas daarna de verbinding. Dat maakt de tussenstap
  zichtbaar en voorkomt dat de speler per ongeluk twee wielen verbindt.

## Addendum 2026-11-15: wormas over twee bestaande tandwielen

De wormas is geen as-tandwiel met een apart bronzen wormwiel meer. Hij ligt als
één ribbelige schroef over **twee bestaande tandwielen** (bijvoorbeeld de motor
en het doel). Dit supersedeert de visuele opzet uit het vorige addendum.

- **Eén tik, twee bestaande wielen.** De speler kiest de wormas en tikt één
  tandwiel. De app kiest het tweede tandwiel dat de machine het best laat
  doorlopen; de schroef wordt over beide wielen getekend. Er komen geen extra
  tandwielen meer bij.
- **Eenrichtingsverkeer blijft.** De `worm`-edge loopt van het invoertandwiel
  naar het uitvoertandwiel met `speedFactor = direction * ratio`. De ratio is
  nog steeds 0,5 of 0,25. De schroef drijft alleen aan, niet terug.
- **Nieuwe levels.** Level 10 en 11 leggen de wormas direct over motor en doel.
  Level 14 doet hetzelfde voor de lift. Level 16 gebruikt een ketting (1×) voor
  de lamp en een wormas (0,5×) voor de lift; de drie tussenwielen zijn
  vervallen.
- **Visueel.** De schroef is een metalen cilinder met echte diagonale ribbels,
  een lichte bovenrand en twee lagers. De ribbels bewegen langzaam, zodat de
  schroef draait. De tray toont dezelfde ribbelige schroef zonder los wiel.
- **Waarom.** Een kind ziet nu één onderdeel over twee wielen liggen in plaats
  van een schroef plus een extra tandwiel dat er niet bij hoort. Dat maakt de
  werking en de plaatsing in één beeld duidelijk.

## Addendum 2026-11-15: wormas ligt bovenop het wormwiel

De schroef loopt niet meer van hart tot hart door beide tandwielen. Hij ligt
horizontaal bovenop het wormwiel en grijpt met zijn onderkant in de
boventanden.

- **Bovenop, niet ertussen.** `wormShaftGeometry` zet de as horizontaal boven
  het uitvoerwiel, op `straal + WORM_SHAFT_CLEARANCE` van het hart. De halve
  cilinder zakt in de tanden; het wielhart en de naaf blijven vrij.
- **Lengte volgt het wiel.** 1,3× de straal (minimaal 70 bordeenheden), zodat
  de schroef ook bij een klein wiel leesbaar blijft en binnen het bord past.
- **Ruimte tussen de wielen.** Level 10 en 11 zetten het doel op kolom 4 in
  plaats van 3. Daardoor staat het wormwiel los van de motor en is de wormas
  de enige verbinding tussen beide.
- **Ribbels lopen mee.** De animatie verschuift de ribbels precies één spoed,
  zodat de lus naadloos blijft bij elke schroeflengte.

## Addendum 2026-11-16: wormas ligt horizontaal op twee gelijke wielen

De wormas is nu een **compacte wormkast met een vaste vertraging** die over
twee even grote tandwielen ligt. Dit vervangt de size-based variant uit het
vorige addendum.

- **Waarom gelijk.** Een rechte wormas kan twee ongelijke wielen alleen op een
  schuine gemeenschappelijke raaklijn raken. Op het bord gaf dat een as die
  boven het kleine wiel leek te zweven en maar één wiel echt raakte. Twee even
  grote wielen leggen de as horizontaal op beide bovenkanten; elk raakpunt is
  zichtbaar hetzelfde.
- **Vaste vertraging.** De wormas is één onderdeel met een eigen vertraging
  (0,5× of 0,25×), zoals een kleine wormkast. De twee wielen zijn even groot;
  de verhouding komt dus niet uit de wieldiameters. Dit is een bewuste
  spellabstractie: in het echt bepalen het aantal schroefgangen en de tanden
  van het wormwiel de ratio.
- **Eenrichtingsverkeer.** De inputkant drijft de schroef, de schroef drijft het
  andere wiel. Het wiel drijft de schroef niet terug. In de graaf is dat één
  `worm`-edge met `speedFactor = ratio`. De auto-plaatsing probeert beide
  richtingen en kiest de kant die de machine laat lopen.
- **Gelijke wielen verplicht.** `canPlace` weigert ongelijke wielen, twee wielen
  die al in elkaar grijpen, een as die van het bord loopt en een derde wiel
  onder de as. De speler tikt één wiel; de app kiest het tweede even grote
  wiel.
- **Ribbels en richting.** De as heeft een metalen gradient, duidelijke
  diagonale schroefdraden, lagers en een contactpatch waarin de tanden van
  beide wielen over de as heen zichtbaar blijven. Een pijl om de as toont de
  draairichting; de ribbels zelf staan stil. Schuivende streepjes zijn daarmee
  vervangen door een statische schroef met een duidelijke richtingpijl, zoals
  in de referentietekening.
- **Aangepaste levels.** Level 10: twee gelijke wielen, 0,5×. Level 11: twee
  gelijke wielen, 0,25×. Level 12 en 13: de ketting is 1× en lost; de wormas is
  0,5× en te langzaam. Level 14: lift met 0,25×. Level 16: ketting 1× voor de
  lamp, wormas 0,5× voor de lift.
- **Waarom.** Het bord laat één schroef over twee gelijke wielen zien, met twee
  gelijke raakpunten. Dat is het beeld dat een kind van een wormas moet
  onthouden; de vaste vertraging houdt de levels leerbaar en deterministisch.

## Addendum 2026-11-16: wormas vervangen door kettingen en tandwielen

De wormas is uit het spel gehaald. De illustratie bleef onduidelijk en de
mechanic paste niet bij de rest van het bord, waar elke verbinding een ketting
of een tandwiel is. Dit supersedeert alle wormas-addenda hierboven.

- **Geen wormas meer.** Het model kent geen `worm`-trayitem, geen
  `worm`-placement, geen `worm`-edge en geen `wormShaft`-geometrie meer. De
  levels 10 en 11 (de twee wormaslessen) zijn vervallen.
- **Snelheid via kettingen.** Hoofdstuk 3 leert snelheid nu met de motor, een
  meter, een ketting over een groot wiel (0,5×) en één motor met twee
  verschillende eindsnelheden (1× en 0,5×).
- **De lift.** De lift hangt aan een ketting over een groot wiel (1/3×), zodat
  hij langzaam genoeg blijft. Level 16 splitst de motor in twee tandwieltreinen:
  twee kleine wielen naar de lamp (1×) en een groot liftwiel (1/3×).
- **Nieuw hoofdstuk 5, "Machines".** Vier levels bouwen voort op alles ervoor:
  twee kettingen vanaf één motor (open en gekruist), een ketting naar een
  tandwiel dat het doel aandrijft, een hijskraan met een snelle lamp en een
  trage lift aan twee kettingen, en als slotstuk de verdeelbox met een tandwiel
  voor de lamp (1×) en een ketting voor de lift (0,5×).
- **Wat blijft.** Kettingen, tandwielen, snelheidsmeters, de lamp, de lift,
  splitsen en de beperkte voorraad. De catalogus heeft nu 20 levels in vijf
  hoofdstukken.

## Addendum 2026-11-17: vijf extra levels in hoofdstuk 6

De catalogus groeit naar 25 levels in zes hoofdstukken. Hoofdstuk 6,
"De fabriek", bundelt de moeilijkste combinaties:

- **21 Tegenrichting.** Twee grote doelen, één open en één gekruiste ketting,
  allebei op 0,5× maar tegen elkaar in.
- **22 De keerkoppeling.** Eerst een tandwiel om de richting te keren, dan een
  ketting om te vertragen; een rechte ketting geeft de verkeerde richting.
- **23 De wenteltrap.** Een diagonale tandwielroute met een middelgroot en een
  groot tandwiel; de rechte rij is niet de oplossing.
- **24 De drievoudige.** Drie uitgangen aan drie kettingen vanaf één motor;
  één doel moet de andere kant op.
- **25 De productielijn.** Een snelle lamp, een trage lift en een doel dat
  andersom draait, met een tandwiel en twee kettingen.

De banden zijn smaller (0,45–0,55) en elk level heeft meer dan één stap nodig.
De vaste instinkers uit eerdere hoofdstukken blijven: ze passen, maar draaien
de verkeerde kant op of halen de band niet.

## Addendum 2026-11-21: vier extra levels in hoofdstuk 7

De catalogus groeit naar 29 levels in zeven hoofdstukken. Hoofdstuk 7,
"De tandwielkamer", verdiept de tandwieltreinen: elk level heeft minstens
drie plaatsingen nodig. Drie levels zijn tandwiel-only; level 28 combineert
twee kettingen met één tandwiel.

- **26 De lange trap.** Drie tandwielen (2, 3 en 2) klimmen diagonaal van de
  motor naar het doel. Twee wielen halen de afstand niet.
- **27 De boog.** Het rechte gat in het midden is geblokkeerd; drie middelgrote
  wielen gaan over de bovenrand. De directe rij is geen oplossing.
- **28 Drie machines.** Twee kettingen en één tandwiel bedienen drie doelen.
  Met twee onderdelen blijven er altijd doelen onbediend.
- **29 De dubbele trap.** Twee doelen, elk met een eigen trein van een klein en
  een middelgroot tandwiel. Vier plaatsingen, en drie is niet genoeg.

De levels zijn zo ontworpen dat de oplossing niet in één of twee stappen kan:
de afstand tussen motor en doel is groter dan twee tandwielen kunnen
overbruggen, of er zijn drie uitgangen die elk een eigen verbinding vragen.
Een test controleert met een uitputtende zoektocht over één en twee
plaatsingen dat geen van de nieuwe levels een kortere oplossing heeft.

## Addendum 2026-11-21: de as als echte nieuwe overbrenging

De catalogus groeit naar 33 levels in acht hoofdstukken. Hoofdstuk 8,
"De aandrijving", voegt de **as** toe: een starre verbinding tussen twee
tandwielen op verschillende gaatjes. De as heeft snelheidsfactor `1` en draait
beide wielen dezelfde kant op. De twee wielen mogen elkaar niet raken, dus de
afstand is groter dan de som van hun stralen.

Daarmee verandert de wiskunde van het spel: bij tandwielen en kettingen
telescopeert de snelheid naar `r_motor / r_doel`, maar een as onderbreekt die
reeks. Groot op de as, klein eraf maakt het doel traag; klein erop, groot eraf
maakt het snel. Snelheidsbanden worden daardoor echte route-eisen in plaats van
alleen een maatkeuze.

- **30 De eerste as.** Drie plaatsingen, doel op 1/3 snelheid. Zonder as is
  1/3 onmogelijk tussen twee even grote wielen.
- **31 De versnelling.** Dezelfde as, maar andersom: doel op 3×.
- **32 De verdeelas.** Eén motor, twee doelen: één tak direct op 1×, één tak
  via de as op 1/3×.
- **33 De sluis.** Een as hangt aan het eerste doel en brengt de beweging door
  naar een tweede doel. Een rij ontbrekende gaatjes maakt de korte route
  onmogelijk; de speler moet door het doel heen.

De levels zijn met dezelfde uitputtende test gecontroleerd: geen enkel nieuw
level is met één of twee plaatsingen op te lossen. Een as tussen motor en doel
is een geldige zet, maar geeft 1× en haalt de snelheidsband niet.

De **tandheugel** is bewust nog niet toegevoegd. Met het huidige model is een
heugel regeltechnisch gelijk aan een open ketting of een doel met een
snelheidsband; dat zou alleen een nieuw plaatje zijn. Een echte heugel vraagt om
een lineaire slag met een aanslag, en die valt buiten deze slice.

## Bronnen

- [Research: Draaiwerk](../research/2026-11-14-draaiwerk.md)
- [Worm drive (Wikipedia)](https://en.wikipedia.org/wiki/Worm_drive)
- [Worm gears: ontwerp en formules (RoyMech)](https://www.roymech.co.uk/Useful_Tables/Drive/Worm_Gears.html)
- [Dubbele-uitgang-wormkast (Tramec)](https://tramec.it/en/product/double-output-worm-gearboxes-series-vm)
- [mechanism-lab (MIT)](https://github.com/jacobplee/mechanism-lab)
- [Licentie mechanism-lab](../../LICENSES/mechanism-lab-MIT.txt)
- [Sprocketry als referentie](https://gameeduhub.com/sprocketry.html)
- [AGENTS.md](../../AGENTS.md), [design system](../design-system.md)
- [CSP](../../apps/games/public/_headers)
