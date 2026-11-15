# Typepret: welke library past?

- **Datum:** 2026-11-07
- **Status:** Onderzoek, daarna doorgevoerd: Typepret gebruikt `react-simple-keyboard` (zie [ADR 0030](../adr/0030-typepret.md)).
- **Aanleiding:** Typepret ([ADR 0030](../adr/0030-typepret.md)) is met eigen invoerlogica en een eigen SVG-toetsenbord gebouwd. De eigenaar wil toch een bestaande library gebruiken, volgens de regel "Bibliotheken eerst" in [AGENTS.md](../../AGENTS.md).
- **Vraag:** welke library vervangt het meeste eigen werk in Typepret, zonder backend, externe requests of CSP-problemen?
- **Kader:** [AGENTS.md](../../AGENTS.md), de [CSP](../../apps/games/public/_headers) (`style-src 'self' 'unsafe-inline'`, geen externe bronnen) en cascade layers zonder `!important`.

## Kort advies

Gebruik **`react-simple-keyboard`** 3.8.295 voor het toetsenbord op het scherm en **`react-hotkeys-hook`** 5.3.3 om toetsaanslagen op te vangen. Het vervangt het eigen SVG-toetsenbord (`libs/features/typepret/ui/keyboard.tsx`) door een onderhouden, MIT-gelicentieerde component. Het is een weergave, geen invoer: de typelogica (`pressKey`) blijft eigen code, want daarvoor bestaat geen bruikbare library.

## Wat Typepret nu zelf doet

| Onderdeel                                  | Nu                                            | Bestaat er een library?                                    |
| ------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| Toetsenbord met oplichtende toets en kleur | eigen SVG, ongeveer 90 regels                 | **Ja:** `react-simple-keyboard`                            |
| Typestatus per doelteken                   | eigen pure engine in `libs/entities/typepret` | Nee bruikbaar: `react-typing-game-hook` is alleen CommonJS |
| Luisteren naar `keydown`                   | `useHotkeys("*")` met `useKey: true`          | **Ja:** `react-hotkeys-hook`                               |
| Lessen, vingerzones, woordenlijst          | eigen data                                    | Geen library; lesopbouw is didactiek                       |
| Voortgang opslaan                          | `readStoredJson`/`writeStoredJson` uit shared | Al aanwezig in de repo                                     |

## Vergelijking

| Kandidaat                                                                    | Versie, onderhoud, licentie                                               | Bespaart                                                  | Beoordeling                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [react-simple-keyboard](https://www.npmjs.com/package/react-simple-keyboard) | 3.8.295, laatst bijgewerkt 2026-11-03, MIT, eigen typen, ESM, React 16–19 | Indeling van toetsen, rijen, per-toets classes, eigen CSS | **Aanbevolen.** Geen runtime-dependencies, ongeveer 12 KB gzip plus 1 KB CSS, geen externe requests, geen `!important` in de CSS.                                                                                                                                                                                                                                         |
| [react-typing-game-hook](https://github.com/jokarz/react-typing-game-hook)   | 1.4.2, laatst bijgewerkt 2023-03-10, Apache-2.0, alleen CommonJS          | Typestatus voor lopende tekst                             | Afgevallen (zie ADR 0030): geen ESM, niet onderhouden, ander model dan één doelteken tegelijk.                                                                                                                                                                                                                                                                            |
| [react-hotkeys-hook](https://www.npmjs.com/package/react-hotkeys-hook)       | 5.3.3, laatst bijgewerkt 2026-06-26, MIT, ESM                             | De `keydown`-listener                                     | **Gekozen (na proef).** Het pakket is voor sneltoetsen gebouwd, maar met `"*"` en `useKey: true` ontvangt het elke losse toets (letters, hoofdletters, `;`, `,`) en kan `preventDefault` per toets. Ctrl, Cmd en herhaalde toetsen komen ook binnen en filteren we zelf. Het bespaart weinig regels, maar de regel "Bibliotheken eerst" weegt minder eigen code zwaarder. |
| [keycap](https://www.npmjs.com/package/keycap)                               | Niet verder onderzocht                                                    | Eén gestylde `kbd`-toets                                  | Alleen een toetsweergave, geen indeling; dekt het toetsenbord niet.                                                                                                                                                                                                                                                                                                       |
| [Keybr](https://github.com/aradzie/keybr.com)                                | AGPL-3.0, complete app                                                    | Niets in code                                             | Alleen referentie voor adaptieve lesopbouw. Niet overnemen.                                                                                                                                                                                                                                                                                                               |

Een zoekactie naar een npm-package met kant-en-klare typlessen of vingerhints leverde niets op; die laag blijft dus eigen werk.

## Wat `react-simple-keyboard` overneemt en wat niet

**Overgenomen:** de rijen en toetsen (`layout`), de kleur en markering per toets met `buttonTheme` (een class per vingerzone en een class voor het doelteken) en de basisstijl uit de meegeleverde CSS.

**Blijft eigen werk:** de vingerkleuren en vingerlabels, het ribbeltje op F en J, de vergroting na drie fouten (`HINT_AFTER_MISTAKES`), de rustige copy en alle invoerregels. De library kent geen vingerindeling.

## Integratieschets

- Vervang `keyboard.tsx` door een dunne wrapper rond `KeyboardReact`. Gebruik `layout` met de drie QWERTY-rijen (`q w e r t y u i o p`, `a s d f g h j k l ;`, `z x c v b n m ,`) en `layoutName="default"`.
- Zet per vingerzone een class in `buttonTheme` (acht classes uit `FINGER_COLORS`) en een class `typepret-target` op het huidige doelteken. De kleuren gaan als CSS-variabelen in `@layer games`, geen `!important`.
- Importeer `react-simple-keyboard/build/css/index.css` binnen de bestaande layers, zodat de repo-stijlen winnen.
- Gebruik de component alleen als weergave: `onKeyPress` doet niets en de wrapper krijgt `aria-hidden`, want alle toetsen zijn `div`-elementen zonder rol of label. De tekst "Gebruik je rechter wijsvinger" blijft de toegankelijke aanwijzing.
- `buttonTheme` geeft geen eigen markering voor het ribbeltje; dat blijft een kleine eigen decoratie via een class op F en J.
- De library zet geen netwerkverbindingen op. De CSP hoeft niet te veranderen.

## Verificatie, risico's en open vragen

**Eigen proef (buiten de app, 2026-11-07):** `react-simple-keyboard` 3.8.295 met React 19 en jsdom, in een aparte map.

- De component rendert drie rijen en 28 toetsen voor de gegeven indeling.
- `buttonTheme` zet de gevraagde classes op de goede toetsen (`finger-index target` op F, `finger-pink` op A en `;`).
- De gepubliceerde code bevat alleen twee URL's in de licentiekop; er zijn geen runtime-requests gevonden.
- De package heeft geen afhankelijkheden (`dependencies` is leeg).

**Niet bevestigd in de proef:**

- In jsdom activeerde een nagebootste `keydown` de optie `physicalKeyboardHighlight` niet. Dat is voor Typepret niet nodig, want wij bepalen het doelteken zelf, maar het is dus niet getest.
- Aanrakingen en klikken op de toetsen zijn niet getest; de component is hier alleen een weergave.
- De proef draaide niet in een Vite-build met de repo-CSS en Tailwind. Controleer vóór adoptie de weergave op 390 en 1024 px, de cascade-volgorde en de bundelgrootte.

**Risico's:**

- Toetsen zijn `div`-elementen zonder rol of label. Dat is acceptabel omdat het toetsenbord decoratief is en `aria-hidden` krijgt.
- Dit levert vooral minder eigen onderhoud op, geen nieuwe functie: het eigen SVG-toetsenbord is al klein. De winst is dat de indeling en toetsstijl uit een onderhouden library komen. Is dat de moeite waard, dan is dit de keuze; anders blijft het huidige toetsenbord prima.
- Nederlandse woordenlijsten (bijvoorbeeld OpenTaal) zijn data, geen npm-library, en zijn niet onderzocht. De 28 woorden in `words.ts` blijven voor nu eigen inhoud.

## Bronnen

- [react-simple-keyboard op npm](https://www.npmjs.com/package/react-simple-keyboard)
- [react-simple-keyboard met TypeScript en hooks](https://github.com/simple-keyboard/react-simple-keyboard-typescript-hooks)
- [Typen van simple-keyboard (opties voor `buttonTheme` en `physicalKeyboardHighlight`)](https://app.unpkg.com/simple-keyboard@3.8.70/files/build/interfaces.d.ts)
- [react-typing-game-hook](https://github.com/jokarz/react-typing-game-hook)
- [react-hotkeys-hook op npm](https://www.npmjs.com/package/react-hotkeys-hook)
- [keycap op npm](https://www.npmjs.com/package/keycap)
- [Keybr](https://github.com/aradzie/keybr.com)

## Aanvulling: proef met react-hotkeys-hook (2026-11-07)

Eigen proef buiten de app met `react-hotkeys-hook` 5.3.3, React 19 en jsdom. Met `useHotkeys("*", handler, { useKey: true, keydown: true, preventDefault })` ontving de handler `f`, `F`, `;`, `,`, `'`, `/`, `Shift`, `Backspace`, en ook Ctrl- en Cmd-combinaties en herhaalde toetsen. `preventDefault` werkte per toets via een functie. Daarom filtert Typepret zelf op losse tekens zonder Ctrl, Cmd, Alt of herhaling. De hook luistert op `document`; testgebeurtenissen moeten dus op `document.body` worden afgevuurd, niet op `window`. Niet getest: gedrag op een echte iPad met een extern toetsenbord.
