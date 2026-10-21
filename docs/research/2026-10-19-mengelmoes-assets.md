# Mengelmoes: sprites, dnd-kit en visuele richting

- **Datum:** 2026-10-19
- **Status:** Onderzoek. Nog geen beslissing of implementatie.
- **Aanleiding:** idee voor een _Little Alchemy_-achtig combinatiespel op tablet: twee elementen op elkaar slepen en iets nieuws ontdekken.
- **Vraag:** kunnen we sprites van een bestaand spel lenen, en hoe maken we het visueel sterk binnen de statische app?
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0005](../adr/0005-pokemon-assets.md) en de [CSP in `_headers`](../../apps/games/public/_headers).

## Samenvatting

1. **We kunnen geen sprites van Little Alchemy lenen.** De naam, het artwork en de vormgeving zijn beschermd. De bestaande GitHub-clones gebruiken óf de originele, geripte assets, óf emoji. Dat is geen veilige bron.
2. **Beste open alternatief: Microsoft Fluent Emoji (MIT).** Ongeveer 1.500 emoji in Color, Flat en High Contrast, als SVG. De Flat-stijl is vriendelijk, consistent en geschikt voor kinderen. We bundelen alleen de ±60 gekozen SVG's lokaal; er komt geen runtime-request bij.
3. **`@dnd-kit/core` hoeft niet te worden toegevoegd.** Versie 6.3.1 staat al in `package.json` en wordt gebruikt in `french-category-sort.tsx`. We kunnen dezelfde sensors, `pointerWithin` en `DragOverlay` hergebruiken.
4. **Visuele richting: een warm laboratorium, geen donkere alchemistenkelder.** Crème achtergrond, houten schap, gekleurde elementmunten met glans, een vrije werkbank en een labboek met ontdekkingen.
5. **Naam:** "My Little Alchemy" ligt te dicht bij de merknaam. Werktitel **Mengelmoes** (of **Mijn Menglab**) is veiliger en Nederlandser.
6. **De genoemde GitHub-repo is inspiratie, geen bron.** `michaeljstevens/really_little_alchemy` heeft geen licentie. De code en de geripte assets mogen we niet overnemen. De collision-aanpak (middelpunten binnen ±15 px) vertalen we naar een eigen TypeScript-detector. Twee MIT-bronnen zijn wél bruikbaar: `trypsynth/alchemist` voor toegankelijkheid en `R74nCom/Elementia-Dataset` voor receptdata.

## 1. Bestaande spellen en hun assets

| Spel                                 | Wat het is                                                  | Kan ik de sprites gebruiken?                                              |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Little Alchemy** (Recloak, 2012)   | Start met vier elementen; combineer tot honderden items.    | **Nee.** Naam, artwork en UI zijn niet openbaar gelicenseerd.             |
| **Little Alchemy 2** (Recloak, 2017) | Uitbreiding met nieuwe visuals, muziek en items.            | **Nee.** Zelfde probleem.                                                 |
| **Doodle God** (JoyBits)             | Vergelijkbaar combineerspel met een andere artstyle.        | **Nee.** Commercieel artwork.                                             |
| **Infinite Craft** (Neal Agarwal)    | AI combineert willekeurige begrippen via een netwerkdienst. | **Nee.** Niet offline, niet deterministisch en niet passend bij onze CSP. |

Op GitHub staan meerdere clones. Het feit dat iets publiek staat, maakt het niet licentie-vrij. Dit is de oogst van een gerichte zoekactie op GitHub en via de Firecrawl-MCP:

| Repository                                                                                                  | Licentie         | Wat het levert                                                                                          | Bruikbaar?                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`michaeljstevens/really_little_alchemy`](https://github.com/michaeljstevens/really_little_alchemy)         | **Geen LICENSE** | 100 items, CreateJS/jQuery-canvas, drag-and-drop, AABB-collision (`±15 px`), 100 geripte PNG's          | **Nee, niet overnemen.** Alleen als ontwerpinspiratie. Geen licentie betekent: alle rechten voorbehouden. |
| [`trypsynth/alchemist`](https://github.com/trypsynth/alchemist)                                             | **MIT**          | Toegankelijke Little Alchemy 1-clone met een select+Combine-fallback, `aria-live`, hints en save/import | **Ja, als code- en toegankelijkheidsreferentie.** Geen drag-and-drop; de UI is een formulier.             |
| [`R74nCom/Elementia-Dataset`](https://github.com/R74nCom/Elementia-Dataset)                                 | **MIT**          | 1.973 elementen, 7.858 combinaties, categorieën in `groups.txt`                                         | **Ja, als receptbron.** Filter een kindvriendelijke subset en vertaal die naar het Nederlands.            |
| [`sshh12/llm_alchemy`](https://github.com/sshh12/llm_alchemy)                                               | MIT              | AI-alchemie met draggen en OpenAI-afbeeldingen                                                          | **Nee.** Vraagt een backend, netwerk en AI; past niet bij de statische app.                               |
| [`darabos/ai-alchemy`](https://github.com/darabos/ai-alchemy)                                               | GPL-3.0          | AI-combinaties                                                                                          | **Nee.** GPL en een netwerkdienst.                                                                        |
| [`jdeworks/elemental-surprise`](https://github.com/jdeworks/elemental-surprise)                             | **Geen LICENSE** | 2.767 elementen, 74.000 recepten, React/TypeScript                                                      | **Nee.** Geen licentie, ondanks de interessante omvang.                                                   |
| [`haurane/little_alchemy_clone`](https://github.com/haurane/little_alchemy_clone)                           | **Geen LICENSE** | Dart/Flutter-clone                                                                                      | **Nee.** Geen licentie.                                                                                   |
| [`Euro20179/Little-Alchemy-Clone`](https://github.com/Euro20179/Little-Alchemy-Clone)                       | **Geen LICENSE** | Python + `textures`-map                                                                                 | **Nee.** Vermoedelijk geripte assets.                                                                     |
| [`AlvajoyAsante/Little-Alchemy-Asset-Ripper`](https://github.com/AlvajoyAsante/Little-Alchemy-Asset-Ripper) | MIT (code)       | Downloadt de originele Little Alchemy-iconen en maakt een spritesheet                                   | **Nee.** De MIT-licentie dekt de ripper-code, niet het geripte artwork.                                   |

### Wat we uit `really_little_alchemy` wél leren

De repo is technisch interesant, maar de code is van 2016 en gebruikt CreateJS, jQuery UI en canvas. De collision-logica is verrassend eenvoudig: twee elementen overlappen als hun middelpunten binnen 30 px van elkaar liggen (`±15 px` per as). Dat is een axis-aligned bounding box met een vaste marge.

Voor onze tabletversie is `±15 px` te streng: een elementmunt is 72–88 px, en een kindervinger is grover dan een muis. We vertalen het idee naar **middelpuntafstand** met een marge van ongeveer 48–56 px. Dat is nog steeds voorspelbaar, maar veel vergevingsgezinder. De implementatie is ongeveer vijftig regels TypeScript, zonder CreateJS.

Let ook op de inhoud: de repo bevat een easter egg waarbij `atomic bomb + earth` een collage van Kim Jong-un en Donald Trump toont, plus een kernontploffingsgeluid. Dat is voor een kinderspel absoluut onbruikbaar. Een extra reden om alleen het idee over te nemen.

Het **mechanisme** (twee elementen combineren) is een algemeen spelidee en kunnen we zelf implementeren. De **uitwerking** — naam, receptenlijst, iconen, schermopbouw — maken we vanaf nul. Dat is ook leuker: dan wordt het echt ons spel.

### Wat we uit de MIT-bronnen overnemen

- **`trypsynth/alchemist`:** de toegankelijke fallback (selecteer twee elementen en druk op Combine), `role="status"`/`aria-live`, een hintknop en een eenvoudig save/importformaat. We bouwen onze eigen React-componenten, maar nemen de patronen over.
- **`Elementia-Dataset`:** de dataset is Engels en bevat ook volwassen of gewelddadige concepten (wapens, drugs, ziektes). We nemen **geen** volledige lijst over. We selecteren 60–80 kindvriendelijke elementen, vertalen ze, controleren de bereikbaarheid en schrijven onze eigen recepten. De MIT-licentie vraagt om naamsvermelding en de licentietekst; die komt in `LICENSES/elementia-MIT.txt`.
- **Geen enkele bron** levert de visuele stijl die we willen. Daarvoor gebruiken we Fluent Emoji en eigen CSS/SVG.

## 2. Open gelicenseerde sprite-sets

| Set                        | Licentie             | Omvang en stijl                                 | Voordelen                                                                        | Aandachtspunten                                                               |
| -------------------------- | -------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Microsoft Fluent Emoji** | MIT                  | ±1.500 emoji; Color, Flat en High Contrast; SVG | Zeer permissief, moderne en vriendelijke stijl, dezelfde set voor alle elementen | Niet elk abstract begrip heeft een emoji; enkele eigen aanvullingen nodig     |
| **Twemoji**                | CC-BY 4.0 (graphics) | ±3.500 emoji; platte SVG                        | Groot, herkenbaar, eenvoudig                                                     | Attributie verplicht; stijl is iets minder modern                             |
| **OpenMoji**               | CC-BY-SA 4.0         | ±4.495 emoji; handgetekend, kleur en zwart-wit  | Warme, illustratieve stijl; één ontwerpsysteem                                   | Share-alike op de iconen; lastiger te combineren met een gesloten assetbeleid |
| **game-icons.net**         | CC-BY 3.0            | ±4.180 monochrome speliconen                    | Sterk voor abstracte concepten (vuur, steen, metaal, robot)                      | Monochroom; kleuren en stijl zijn eigen werk; niet alle dagelijkse voorwerpen |
| **Kenney**                 | CC0                  | Diverse 2D/3D-packs                             | Geen attributie nodig; goed voor UI, frames en deeltjes                          | Geen complete woordenlijst; stijlen verschillen per pack                      |
| **Lucide**                 | ISC                  | ±1.500 algemene UI-iconen                       | Staat al in de app via `@shared/ui`                                              | Te beperkt voor 60 elementen                                                  |

### Advies

Gebruik **Fluent Emoji Flat** als basis. Het is MIT, het ziet er verzorgd uit en het dekt waarschijnlijk 90% van de elementen:

- water, vuur, aarde, lucht
- modder, steen, lava, stoom, regen
- plant, boom, hout, bloem
- metaal, gereedschap, huis, boot
- vis, vogel, draak, robot
- dorp, stad, familie

Voor de paar begrippen zonder passende emoji maken we **twee of drie eigen SVG's** in dezelfde platte stijl. Denk aan "leven", "mengsel" of "uitvinding". We mengen dus niet twee grote stijlen; we vullen één set aan.

De gekozen SVG's komen eenmalig in `apps/games/public/elements/` en worden gecommit. Een script (`scripts/build-element-sprites.ts`) bouwt ze tijdens ontwikkeling uit lokale Iconify-pakketten (`@iconify-json/fluent-emoji-flat`, met `@iconify-json/ph` als terugval), net zoals de Pokémon-assets eenmalig zijn binnengehaald. Er is geen netwerk nodig bij het bouwen of spelen. Tijdens het spelen doet de app alleen een request naar de eigen origin; de CSP blijft `img-src 'self' data:`.

**Attributie:** voeg `LICENSES/fluent-emoji-MIT.txt` toe en noem de bron in een klein "Over dit spel"-paneel of in `docs/credits.md`. Bij MIT is dat geen zware verplichting, maar het is netjes en het maakt de herkomst controleerbaar. Als we later toch OpenMoji gebruiken, moet de share-alike-voorwaarde expliciet worden gedocumenteerd.

## 3. Visuele richting

### 3.1 Uitgangspunten

- **Warm en uitnodigend**, niet donker of mystiek. De app is voor kinderen van ongeveer 4 tot 10 jaar.
- **Laboratorium als speeltafel**, niet als schoolboek. Denk aan een houten schap, glazen potjes, gekleurde munten en een mengkom.
- **Één icoonstijl.** Geen mix van emoji, lucide-lijnen en zelfgetekende pixelart.
- **Veel visuele feedback, weinig tekst.** De elementnaam is belangrijk, maar het icoon draagt de betekenis.
- **Geen straf.** Een mislukte combinatie is een grappig plofje, geen rood kruis en geen levens.

### 3.2 Elementmunt

Elk element is een grote ronde tegel:

- 72 px op mobiel, 80–88 px op tablet.
- Kleurverloop per categorie (water, vuur, aarde, lucht, leven, techniek, fantasie).
- Een subtiele glans linksboven en een dunne binnenring, zodat het als een glazen munt of flesje voelt.
- Het icoon vult ongeveer 60% van de tegel.
- De naam staat eronder, vet en kort.
- Bij slepen: scale 1.08, lichte rotatie, sterke schaduw.
- Bij "nog niet ontdekt": een donkere silhouette of een groot vraagteken, zonder naam.

Categoriekleuren kunnen aansluiten bij de bestaande Tailwind-tokens:

| Categorie | Kleur            | Voorbeelden                      |
| --------- | ---------------- | -------------------------------- |
| water     | blauw            | water, regen, stoom, ijs         |
| vuur      | oranje/rood      | vuur, lava, kampvuur, energie    |
| aarde     | groen/bruin      | aarde, modder, steen, plant      |
| lucht     | paars/lichtblauw | lucht, wolk, wind                |
| leven     | emerald          | leven, vis, vogel, mens          |
| techniek  | leisteen         | metaal, gereedschap, robot, stad |
| fantasie  | violet           | draak, toverstaf, eenhoorn       |

### 3.3 Werkbank

De werkbank volgt het origineel: een **vrij veld** waarin het kind elementen plaatst en op elkaar sleept. Dat is speelser dan twee vaste gleuven en het maakt de collision-logica echt onderdeel van het spel.

- Een crème "labmat" met een fijn stippatroon of ruitpatroon (CSS, geen afbeelding).
- Elementen uit het schap sleep je naar de werkbank; daar blijven ze staan.
- Sleep je één element op een ander, dan proberen we te mengen. Binnen een straal van ongeveer 56 px tussen de middelpunten telt als "erop".
- Gelukt: beide elementen verdwijnen en het resultaat verschijnt op het middelpunt.
- Niet gelukt: beide munten wiebelen en blijven staan. Geen straf, geen verwijdering.
- Een **opruim**-knop haalt alle elementen van de werkbank terug naar het schap.
- Maximaal ongeveer 12 elementen op de werkbank; daarna schuift het oudste terug naar het schap. Zo blijft het overzichtelijk.
- Voor de jongste kinderen kan een **twee-gleuven-variant** als rustige modus: twee vakken, een plus en een grote **Meng**-knop. Dezelfde spellogica, minder vrijheid.

Tikken blijft de toegankelijke route: tik element A, tik element B, en de app probeert te mengen. Slepen is nooit verplicht.

### 3.4 Combineer-animatie

1. De twee munten tillen op en zweven naar het midden.
2. Ze draaien een kwartslag om elkaar heen.
3. Een korte flits en een paar deeltjes.
4. Het resultaat verschijnt met een rubberachtige pop (scale 0.8 → 1.05 → 1).
5. Bij een nieuw element: confetti en een "Nieuw!"-lint.
6. Bij een ongeldige combinatie: beide munten wiebelen terug en er klinkt een zachte, lage plof.

Duur: 300–450 ms. Bij `prefers-reduced-motion` blijven alleen de begin- en eindstand over.

### 3.5 Ontdekkingskaart

Na een nieuwe combinatie verschijnt een kaart in de stijl van een laboratoriumlabel:

- groot icoon
- naam in dikke, ronde letters
- categorie als klein gekleurd label
- één korte, nieuwsgierige zin (bijvoorbeeld "Water + vuur = stoom. Stoom kan weer iets anders worden...")
- "Bewaar in labboek" en "Nog een"

De kaart is ook een natuurlijk moment voor `aria-live`: "Nieuw element ontdekt: stoom."

### 3.6 Labboek

- Volledig scherm of grote sheet.
- Bovenaan een teller: **23 / 60** en een dunne voortgangsring.
- Filters als chips per categorie.
- Raster van elementmunten; ontdekt in kleur, onontdekt als donkere silhouette met een vraagteken.
- Tik op een ontdekt element voor een detailkaart met een weetje en de gebruikte combinatie. Onontdekte ingrediënten van alternatieve recepten blijven een vraagteken; ze tonen pas naam en icoon als het kind ze zelf heeft ontdekt.
- Geen timer, geen "je mist er nog één"-druk. Wel een subtiele "nieuw"-badge.

### 3.7 Geluid en haptiek

Gebruik de bestaande synthesizer uit `libs/shared/lib/sound.ts`; er zijn geen audiobestanden nodig.

| Actie                 | Geluid         | Haptiek  |
| --------------------- | -------------- | -------- |
| element oppakken      | `tap`          | `tap`    |
| in gleuf laten vallen | `select`       | `select` |
| geldige combinatie    | `match`        | `match`  |
| ongeldige combinatie  | `wrong`, zacht | `wrong`  |
| nieuw element         | `win`          | `win`    |
| hint                  | `hint`         | `hint`   |

De bestaande `SoundToggle` en de globale mute-instelling blijven leidend. Geluid start nooit automatisch.

## 4. dnd-kit

`@dnd-kit/core` 6.3.1 staat al in `package.json` en wordt gebruikt in `libs/features/french-listening/ui/french-category-sort.tsx`. Daar staan precies de onderdelen die we nodig hebben:

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
);
```

- **`DndContext`** om de werkbank en het schap.
- **`useDraggable`** op elke elementmunt.
- **`useDroppable`** op de werkbank en op elke geplaatste munt.
- **`DragOverlay`** voor de zwevende munt; de originele tegel blijft gedimd achter.
- **Tap-tap** blijft de toegankelijke route: tik element A, tik element B. Slepen is nooit verplicht.
- **Toetsenbord:** de knoppen zijn echte buttons met `aria-pressed`; de tik-tik-route werkt ook met Enter en Spatie.

### 4.1 Collision: van center-AABB naar dnd-kit

De referentie-repo vergelijkt de middelpunten van twee elementen met een vaste marge van 15 px. Voor dnd-kit schrijven we een eigen `CollisionDetection` die hetzelfde idee gebruikt, maar met een grotere marge en een sorteerstap:

```ts
import type { CollisionDetection } from "@dnd-kit/core";

const MERGE_DISTANCE = 56;

export const mergeCollision: CollisionDetection = (args) => {
  const active = args.collisionRect;
  const activeX = active.left + active.width / 2;
  const activeY = active.top + active.height / 2;

  return args.droppableContainers
    .map((container) => {
      const rect = args.droppableRects.get(container.id);
      if (!rect) return null;
      const dx = activeX - (rect.left + rect.width / 2);
      const dy = activeY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      return distance <= MERGE_DISTANCE ? { id: container.id, data: { value: distance } } : null;
    })
    .filter((hit): hit is NonNullable<typeof hit> => hit !== null)
    .sort((a, b) => a.data.value - b.data.value);
};
```

De werkbank zelf is ook droppable. De detector geeft eerst de dichtstbijzijnde munt terug en daarna de werkbank, zodat "op een element laten vallen" altijd voorrang krijgt op "ergens op de werkbank laten vallen".

Voor de twee-gleuven-variant is `pointerWithin` genoeg; dan zijn er geen vrije posities en geen aangepaste detector nodig.

### Scrollen versus slepen

Dit is het belangrijkste tabletrisico. **In de implementatie** scrollt het schap op een telefoon en in tabletportret horizontaal en in tabletlandschap verticaal. Daarom volgt `touch-action` op elke munt én op het onzichtbare sleepvlak de scrollrichting van het schap:

- horizontaal schap: `touch-pan-x`; een veeg langs het schap scrolt, een sleep dwars op de scrollrichting (naar de werkbank) pakt het element op;
- verticaal schap: `touch-pan-y`, met dezelfde regel;
- de scrollbar is met `game-scrollbar` zichtbaar waar de browser aangepaste scrollbars ondersteunt, zodat er ook met een muis of stylus een greep is om te scrollen;
- gebruik een raster met categoriefilters, zodat het schap niet onnodig lang wordt;
- gebruik `MouseSensor` (afstand 6 px) voor een muis en `TouchSensor` (delay 150 ms) voor een vinger; `PointerSensor` luistert ook naar touch en kan een veeg als sleep beginnen;
- test op 390 px en 1024 px in Playwright, niet alleen in jsdom. jsdom heeft geen echte pointergeometrie.

Tikken blijft de primaire en meest toegankelijke route. Een lange-druk-drag met een langere delay is niet nodig zolang de dwarsrichting vrij blijft voor slepen.

## 5. Technische opzet

De vorm volgt de bestaande FSD-aanpak:

- `libs/entities/alchemy/` — pure data en regels: elementen, recepten, `combine()`, `reachable()`, `hints()`, `tierOf()`.
- `libs/features/alchemy-lab/` — Zustand-store, opslag, UI: werkbank, elementmunt, labboek, hint-sheet, ontdekkingskaart.
- `libs/pages/alchemy/` — de pagina die de lagen samenstelt.
- Route `/mengelmoes` in `apps/games/src/app/router.tsx`.
- Catalogusentry in `libs/entities/game/model/game-catalog.ts`.
- Opslag onder `games.mengelmoes.v1`, met een versie-key en type guards.
- Tests: `tests/node/alchemy-*.test.ts`, `tests/web/alchemy.test.tsx`, `tests/web/alchemy-storage.test.ts`, `e2e/alchemy.spec.ts`.

De receptdata komt uit een **gecurateerde subset** van `Elementia-Dataset` (MIT). We bewaren de bron en de licentietekst in `LICENSES/elementia-MIT.txt`. De toegankelijkheidspatronen komen uit `trypsynth/alchemist` (MIT); de code daarvan is JavaScript en wordt niet één-op-één gekopieerd, maar de aanpak (select+Combine, `aria-live`, hints, save/import) nemen we over. Voor de visuele laag gebruiken we Fluent Emoji (MIT).

### Recepten valideren

De kwaliteit zit in de data, niet in de UI. Voeg tests toe die controleren:

- elke recept verwijst naar bestaande elementen;
- hetzelfde paar levert nooit twee verschillende resultaten op;
- elk niet-basis-element is bereikbaar vanuit de vier basislementen;
- elk element heeft minstens één recept (behalve de basis);
- elk element opent minstens één nieuwe mogelijkheid, behalve de hoogste tier;
- een hint verwijst nooit naar een element dat al ontdekt is.

### Eerste slice

- 4 basislementen: water, vuur, aarde, lucht.
- 96 elementen en 104 recepten, met eigen Nederlandse namen en Fluent Emoji Flat-iconen.
- Een vrije werkbank met sleep- en tik-tik-mengen.
- Labboek, hints en lokale opslag.
- Ontdekkingsanimatie en de bestaande geluiden.

De receptenboom is de grootste kostenpost; hij moet logisch, Nederlands en verrassend zijn. Verdere uitbreiding kan met nieuwe takken, zolang elk element bereikbaar blijft en er geen dubbele recepten ontstaan.

## 6. Risico's en open vragen

- **Auteursrecht en merk:** gebruik geen Little Alchemy-assets of de naam "My Little Alchemy". Kies een eigen naam en eigen recepten. Het mechanisme is vrij, de uitwerking niet.
- **GitHub-licenties:** geen `LICENSE` betekent niet "vrij te gebruiken". Van de onderzochte clones zijn alleen `trypsynth/alchemist` en `R74nCom/Elementia-Dataset` MIT; de rest is geen bron.
- **Datasetfilter:** de MIT-dataset bevat ook wapens, drugs, ziektes en volwassen concepten. Selecteer alleen kindvriendelijke elementen en houd de Nederlandse namen controleerbaar.
- **Licentie:** Fluent Emoji is MIT, maar bewaar de license-tekst en de bron. Bij OpenMoji komt share-alike om de hoek; dat willen we vermijden.
- **Stijlconsistentie:** één icoonstijl, geen mengelmoes van emoji, lijnen en pixelart. Eigen aanvullingen moeten dezelfde platte stijl volgen.
- **Inhoud:** een receptenboom kan onlogisch of oneerlijk voelen. Test met kinderen en zorg voor hints en meerdere routes.
- **Tablet:** slepen mag scrollen niet blokkeren; tik-tik moet altijd werken.
- **Bundel:** 60 SVG's van ±10–30 KB zijn samen ongeveer 1 MB. Dat is acceptabel, maar optimaliseer met SVGO en laad alleen wat nodig is.
- **Naam:** "My Little Alchemy" is te dicht bij de originele merknaam. Werktitels: **Mengelmoes**, **Mijn Menglab**, **Toverketel**.

## Bronnen

- [Microsoft Fluent Emoji — GitHub, MIT](https://github.com/microsoft/fluentui-emoji)
- [Twemoji — graphics CC-BY 4.0](https://github.com/twitter/twemoji)
- [OpenMoji — CC BY-SA 4.0](https://github.com/hfg-gmuend/openmoji)
- [game-icons.net — CC BY 3.0](https://game-icons.net/about.html)
- [Kenney — CC0 game assets](https://kenney.nl/assets)
- [Little Alchemy — officiële site](https://littlealchemy.com/)
- [michaeljstevens/really_little_alchemy — geen licentie](https://github.com/michaeljstevens/really_little_alchemy)
- [trypsynth/alchemist — MIT](https://github.com/trypsynth/alchemist)
- [R74nCom/Elementia-Dataset — MIT](https://github.com/R74nCom/Elementia-Dataset)
- [sshh12/llm_alchemy — MIT, AI/backend](https://github.com/sshh12/llm_alchemy)
- [darabos/ai-alchemy — GPL-3.0](https://github.com/darabos/ai-alchemy)
- [jdeworks/elemental-surprise — geen licentie](https://github.com/jdeworks/elemental-surprise)
- [dnd-kit documentatie](https://dndkit.com/)
- [Onderzoek naar de game-stack, inclusief dnd-kit en animatie](2026-10-17-game-stack-dependencies.md)
- `package.json` — `@dnd-kit/core` 6.3.1
- `libs/features/french-listening/ui/french-category-sort.tsx` — bestaande dnd-kit-opzet
- `apps/games/public/_headers` — CSP met `img-src 'self' data:`
