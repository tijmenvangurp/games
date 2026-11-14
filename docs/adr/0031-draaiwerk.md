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

## Bronnen

- [Research: Draaiwerk](../research/2026-11-14-draaiwerk.md)
- [mechanism-lab (MIT)](https://github.com/jacobplee/mechanism-lab)
- [Licentie mechanism-lab](../../LICENSES/mechanism-lab-MIT.txt)
- [Sprocketry als referentie](https://gameeduhub.com/sprocketry.html)
- [AGENTS.md](../../AGENTS.md), [design system](../design-system.md)
- [CSP](../../apps/games/public/_headers)
