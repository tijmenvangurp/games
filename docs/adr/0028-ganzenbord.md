# ADR 0028: Ganzenbord met een hergebruikte klassieke kaart

- **Status:** Aangenomen
- **Datum:** 2026-11-06

## Context

Na Vier op een Rij wilden de kinderen een klassiek Ganzenbord op de tablet. De eisen:

- de klassieke Nederlandse spelregels met 63 vakjes en twee dobbelstenen;
- twee tot vier spelers op één apparaat;
- per speler de keuze tussen een mens en de computer;
- een groot, herkenbaar bord op een tablet;
- volledig statisch, zonder backend, accounts of externe requests;
- geen eigen bordtekening als daar een bestaand, vrij bord voor is.

Het eerdere [bibliotheekonderzoek](../research/2026-11-05-ganzenbord-libraries.md) vond geen bruikbare spelengine, maar wel bruikbare borden en ganzensilhouetten in het publieke domein. De commerciële referentie van Playtouch is alleen als sfeerreferentie gebruikt; daarvan is niets overgenomen.

## Beslissing

1. **De klassieke Nederlandse regels.** Het bord heeft 63 vakjes; je gooit met twee dobbelstenen en moet precies op 63 eindigen. Bij overschrijding tel je vanaf 63 terug. De ganzen staan op 5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54 en 59: je gaat hetzelfde aantal ogen nog eens. De speciale vakjes zijn brug 6 → 12, herberg 19 → één beurt overslaan, put 31 en gevangenis 52 → wachten tot een andere speler je aflost, doolhof 42 → 37 en dood 58 → start. Een eerste worp van 9 gaat met 5 + 4 naar 53 en met 6 + 3 naar 26.
2. **Geen wisselregel op een bezet vakje.** Meerdere pionnen mogen op hetzelfde vakje staan; de UI spreidt ze. Dat is de eenvoudige Nederlandse variant en voorkomt een extra regel in de uitleg.
3. **De put en de gevangenis blijven klassiek.** Je wacht tot iemand je aflost. Zitten alle overgebleven spelers vast, dan eindigt de partij in gelijkspel. Dat is zeldzaam bij drie of vier spelers, maar bij twee spelers mogelijk; de uitslag toont dan expliciet “Gelijkspel”.
4. **Speler 1 begint.** De klassieke “hoogste worp begint”-variant is bewust weggelaten; die zou een extra startfase en meer uitleg vragen. De speler die als eerste in de setup staat, begint.
5. **Een kleine, pure engine in `libs/entities/ganzenbord`.** `playTurn(game, dice)` krijgt de worp van buiten en doet alles wat daaruit volgt: verplaatsen, terugtellen, ganzen, gevaren, put/gevangenis, beurtwissel, skips en de uitslag. De functie geeft een nieuwe toestand plus `TurnEvent`s terug. De store en de tests bepalen de dobbelsteenwaarden, zodat het spel deterministisch testbaar is.
6. **Geen boardgame.io of andere engine.** De regels zijn klein en lineair; een engine zou vooral een tweede stateparadigma en een grotere bundel toevoegen. Zie ook [ADR 0025](0025-vier-op-een-rij.md).
7. **Het bord is hergebruikt, niet getekend.** De basis is de publiek-domein scan [Oud Hollands Ganzenbord, objectnr A 41258](https://commons.wikimedia.org/wiki/File:Oud_Hollands_Ganzenbord,_objectnr_A_41258.tif). Het bord is uitgesneden tot `apps/games/public/ganzenbord/board.webp` (1800 px breed, ca. 630 kB). De 63 celposities zijn één keer met de hand gekalibreerd op de scan en staan in `libs/features/ganzenbord/model/board-points.ts`. Op het toestel zelf zijn ze bij te stellen via `/ganzenbord/bord`; die afwijkingen worden als percentage in `localStorage` bewaard en over de vaste waarden gelegd. Het bord krijgt een houten lijst via CSS.
8. **De pionnen zijn 2D-ganzen, geen 3D-modellen.** De gebruikte silhouet is de publiek-domein [NIH BioArt-gans](<https://commons.wikimedia.org/wiki/File:Goose_Silhouette_(NIH_BioArt_177_-_630230).svg>) (NIAID/Ryan Kissinger). Dezelfde vorm vult de ganzenvakjes. De pion is een ronde token in de spelerkleur met een wit ganzensilhouet; dat is op een tablet beter leesbaar dan een klein 3D-model en past bij de vlakke app.
9. **2,5D in DOM/CSS, geen Three.js.** Het bord is een lokale WebP-afbeelding met CSS-hout, slagschaduw en absolute pionnen. Een WebGL-scene zou 160–340 kB gzip extra kosten en de geschilderde kaart niet beter maken. De klassieke kaart, de houten lijst en de schaduw geven al de fysieke indruk.
10. **Twee witte dobbelstenen met groene stippen.** `react-dice-complete` 2.3.2 (ISC) rendert en animeert de dobbelstenen. De store geeft de waarden via `rollAll`; de bibliotheek doet geen eigen willekeurige worp. De peer-range noemt React 19 niet, maar de component rendert met React 19.3.1; dit is in het onderzoek en hier vastgelegd.
11. **Twee tot vier spelers, per speler mens of computer.** De setup bewaart `playerCount` en de controller per speler in `localStorage` onder `games.ganzenbord.v1`. Een computer gooit na een korte denkpauze automatisch. De winst per speler blijft lokaal bewaard.
12. **Elke gebeurtenis krijgt een eigen moment.** De pion loopt vakje voor vakje. Bij een gans, brug, put, gevangenis, doolhof, dood of finish verschijnt een kaart op het vak waar de pion staat; die kaart blijft staan tot de speler op **Verder** tikt. Pas daarna springt of loopt de pion verder. Het bord zoomt daarbij in op het vak en blijft na de beurt nog heel even ingezoomd voordat het weer uitzoomt. Zo kan een kind de gebeurtenis lezen voordat het spel verdergaat.
13. **Geen spraakcatalogus.** Het spel is visueel; de catalogusentry gebruikt `speech: { kind: "visual" }` en de pagina verbergt de voorleesknop. Later kan een audio-opname worden toegevoegd.

### Bordalternatieven

De volgende borden zijn onderzocht en als terugvaloptie gedocumenteerd in het [onderzoek](../research/2026-11-05-ganzenbord-libraries.md):

- **[Oud Hollands Ganzenbord](https://commons.wikimedia.org/wiki/File:Oud_Hollands_Ganzenbord,_objectnr_A_41258.tif)** — publiek domein, echte vintage kaart. Authentieker, maar de vakposities moeten worden gekalibreerd en de stijl is ouder.
- **[Game of the Goose.svg](https://commons.wikimedia.org/wiki/File:Game_of_the_Goose.svg)** — CC0, moderne vectorkaart. Mooi en vrij, maar de vakken en regels wijken af van de Nederlandse klassieke indeling.
- **[Joseph Scholz Ganzenbordspel](https://commons.wikimedia.org/wiki/File:Joseph_Scholz_-_Ganzenbordspel,_Mainz,_circa.jpg)** — publiek domein, 19e-eeuws. Erg authentiek, maar kleine cijfers en veel tekst.
- **Rijksmuseum-ganzenborden** — CC0, 5.600–10.600 px. Geschikt als inspiratie of museum-skin, niet als moderne UI.

De gekozen vectorkaart is scherp op een tablet, heeft alle 63 vakjes en de klassieke gevaren, en de cijfers zijn goed leesbaar. De anderen blijven beschikbaar als het visuele budget later verschuift.

## Gevolgen

- De game is beschikbaar op `/ganzenbord`, in de catalogus en in het spelmenu.
- De bundel groeit met de dobbelsteencomponent (ongeveer 4 kB gzip) en het bord (ongeveer 63 kB gzip). Het bord wordt als statisch asset geladen, niet in de JS-bundel.
- De engine is los testbaar: 18 regeltests, inclusief duizenden willekeurige partijen om vastlopers te vinden.
- De eerste speler is altijd speler 1. Wil de eigenaar later een startworp of wisselende starter, dan kan dat in de engine worden toegevoegd zonder de UI te herschrijven.
- Bij twee spelers kan een potje in een gelijkspel eindigen. De uitslag en de spelregels zeggen dat expliciet.
- De put/gevangenis-regel kan onduidelijk zijn voor jonge kinderen; de popup/status en het spelregelblad leggen uit wat er gebeurt.
- De licentie van `react-dice-complete` (ISC) en de hergebruikte assets staan in `LICENSES/`. De commerciële referentie-app is niet gebruikt.
