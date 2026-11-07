# Spellen

Een publieke, statische spelletjes-app voor kinderen. De app draait volledig
in de browser, zonder backend en zonder externe requests tijdens het spelen.

## Taal

**Spel**:
Een zelfstandige speelervaring met een eigen route, regels, scherm en plaats in
de spelcatalogus.
_Avoid_: game, module, app

**Slice**:
Een Nx-project binnen één FSD-laag, met een eigen `project.json`,
`tsconfig.json` en public API.
_Avoid_: package, module

**Feature**:
De laag met de Zustand-store, opslag, spraak en UI van één spel of spelonderdeel.
_Avoid_: game logic, component

**Entity**:
De laag met pure domeinregels, types en data, zonder React of opslag.
_Avoid_: model, domain

**Page**:
De laag die een scherm samenstelt uit widgets en features.
_Avoid_: view, screen

**Widget**:
Een samengesteld UI-blok dat door meerdere pages of features wordt gebruikt.
_Avoid_: component, block

**Spelcatalogus**:
`gameCatalog` in `libs/entities/game/model/game-catalog.ts`: de lijst met
spellen, routes, thumbnails en spraakverklaringen op het startscherm.
_Avoid_: menu, game list

**Spraakverklaring**:
De expliciete keuze in de spelcatalogus hoe een spel met spraak omgaat:
`group`, `visual`, `pending` of `legacy`.
_Avoid_: audio flag, speech mode

**Spraakgroep**:
Een verzameling `SpeechLine`-regels onder één audiomap, ontdekt via
`model/audio.ts` en de public API van de slice.
_Avoid_: audio set, voice group

**Audiocatalogus**:
De door `scripts/lib/audio-catalog.ts` opgebouwde lijst van alle spraakgroepen
en regels, met teksthashes en het lockbestand.
_Avoid_: audio index, manifest

**Sterren**:
De beloning per ronde of puzzel. Eén ster per goed antwoord of opdracht; een
fout kost een ster, maar het spel gaat door.
_Avoid_: score, punten

**Ronde**:
Eén afgebakende speelsessie met een vaste set vragen of opdrachten.
_Avoid_: level, game

**Adaptief niveau**:
De moeilijkheidsgraad die na een ronde omhoog of omlaag gaat op basis van
accurateheid, hints en vastlopen.
_Avoid_: difficulty, rank

**Vastgelopen ronde**:
Een ronde waarin het kind een cluster van signalen laat zien (weinig
accurateheid, veel hints of veel ongeldige tikken), waardoor het niveau
minstens één stap zakt.
_Avoid_: failed, lost

**Hinttrap**:
Het bewust niet meteen weggeven van het antwoord: eerst een visuele of
woordelijke hint, daarna pas de oplossing.
_Avoid_: cheat, answer

**Puzzel**:
Een schaakpuzzel met een stelling en een gevraagde zet. Niet te verwarren met
de kaartpuzzel van Vlaggenreis.
_Avoid_: puzzle game, opgave

**Kaartpuzzel**:
De variant van Vlaggenreis waarin een land of provincie op de juiste plek op
de kaart wordt gelegd.
_Avoid_: map game, geography puzzle

**Element**:
Een basis- of samengesteld item in Mengelmoes, met een lokaal icoon en
combinatieregels.
_Avoid_: item, ingredient

**Missie**:
Een doel in Mengelmoes dat vraagt om een bepaald element te ontdekken.
_Avoid_: opdracht, quest

**Les**:
Een Franse luisterles met woorden, voorbeeldzinnen en audio.
_Avoid_: unit, chapter

**Klank**:
De gesproken eenheid van een letter, zoals `/m/`, niet de letternaam "em".
_Avoid_: letter sound, foncem

**Thumbnail**:
De lokale JPEG van 800 × 500 op het startscherm, met een contenthash in de
bestandsnaam.
_Avoid_: image, cover

**ADR**:
Een Architecture Decision Record in `docs/adr/` dat een moeilijk terug te
draaien ontwerp-, privacy- of deploymentbeslissing vastlegt.
_Avoid_: design doc, nota

**Kwaliteitsgate**:
De combinatie van `quality`, `quality:full` en CI-checks die een wijziging
moet halen voordat hij gemerged mag worden.
_Avoid_: CI, checks

**Eigenaar**:
De persoon die de repository beheert en expliciet toestemming geeft voor een
merge of een deploy.
_Avoid_: maintainer, admin

**Agent-harness**:
De gedeelde skills, MCP's en permissions waarmee een agent in deze repo werkt;
zie `docs/agents.md`.
_Avoid_: tooling, setup
