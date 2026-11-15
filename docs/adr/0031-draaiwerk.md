# ADR 0031: Draaiwerk als deterministische tandwielpuzzel

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

## Addendum 2026-11-15: wormas verbindt twee wielen

De wormas is nu een **verbinding tussen twee bestaande tandwielen**, niet een
as die één wiel aandrijft. Dit supersedeert het eenrichtingsverkeer en de vaste
ratio's uit de vorige addenda.

- **Onderzoek.** Een worm en een wormwiel hebben assen die loodrecht op elkaar
  staan. Eén wormas kan meerdere wormwielen langs zijn lengte aandrijven; dat
  bestaat als dubbele-uitgang-wormkast. De twee wielen draaien dan dezelfde kant
  op en de snelheidsverhouding volgt uit hun tandenaantal, niet uit een vaste
  schroefratio.
- **Twee richtingen.** De `worm`-edge loopt in de graaf beide kanten op met
  `speedFactor = straal_van / straal_naar`. De speler mag dus vanaf elk van de
  twee wielen beginnen. De schroef is een verbinding zoals een ketting, maar
  zonder lus om de wielen.
- **Geen vaste ratio meer.** `TrayItem` en `Placement` hebben voor de worm geen
  `ratio` of `direction` meer. Level 10 gebruikt twee even grote wielen (1×),
  level 11 een groot wormwiel (0,5×). De sterke wormas uit level 11 is daarmee
  een grote vertraging door het wiel, niet door een apart schroefprofiel.
- **Gemeenschappelijke raaklijn.** `wormShaft` legt de as op de gemeenschappelijke
  buitenraaklijn van beide steekcirkels. Bij even grote wielen is dat een
  horizontale as boven beide; bij ongelijke wielen loopt de as schuin. De as
  ligt `WORM_SHAFT_CLEARANCE` van de steekcirkel, zodat de onderkant in de
  tandtoppen zakt en de naaf vrij blijft.
- **Plaatsing.** `canPlace` weigert twee wielen die al in elkaar grijpen, een as
  die van het bord loopt en een as die een derde tandwiel raakt. De speler tikt
  één wiel; de app kiest het tweede wiel dat de machine het best laat lopen.
- **Aangepaste levels.** Level 10 verbindt twee even grote wielen. Level 11
  gebruikt een groot wormwiel voor de vertraging. Level 12 en 13 hebben alleen
  de ketting in de bak, omdat een wormas tussen twee even grote wielen dezelfde
  1× zou geven. Level 14 heeft alleen de wormas. Level 16 houdt de ketting voor
  de lamp en de wormas voor de lift; de lift kreeg een groter wiel.
- **Waarom.** Het bord laat nu één schroef over twee wielen zien, met twee
  raakpunten. Dat is het beeld dat een kind van een wormas moet onthouden en het
  maakt de wormas een echte verbindingsmethode naast de ketting.

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
