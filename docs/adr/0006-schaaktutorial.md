# ADR 0006: Schaaktutorial met chess.js en react-chessboard

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De app krijgt een schaaktutorial voor jonge kinderen. De eerste drie lessen leren de looproute van één stuk per keer: de toren, het paard en de pion. Elk level is een geïsoleerde oefening met een eigen FEN, een doelveld en een korte instructie. De app blijft statisch en doet geen externe requests.

Voor zetvalidatie is een bestaande schaakengine nodig. Voor slepen, neerzetten en terugsnappen is een toegankelijke bordcomponent nodig. Zelf een complete schaakengine of drag-and-drop-bord bouwen zou veel meer code en risico opleveren dan de tutorial rechtvaardigt.

## Beslissing

1. **chess.js 1.4.0 valideert alle zetten.** De engine geeft per zet een discriminated union terug: geldig met de nieuwe FEN, of ongeldig met een reden. Ongeldige zetten zorgen dat `react-chessboard` het stuk laat terugsnappen.
2. **react-chessboard 5.12.1 rendert het bord.** De v5 `options`-API wordt gebruikt, met `showNotation: true` en `squareStyles` voor de selectie, legale doelvelden, de laatste zet en het doelveld.
3. **De FEN is de enige bron van waarheid.** De hook bewaart geen verborgen muteerbare `Chess`-instantie. De pure engine maakt per validatie een tijdelijke instantie aan. Dit is deterministisch en veilig onder React StrictMode.
4. **Level-FEN's bevatten alleen de lesstukken.** Daardoor staan er geen koningen op het bord. chess.js laadt deze stellingen met `skipValidation`; de zetvalidatie zelf blijft volledig actief. Na een geldige zet zet de engine de stelling terug op wit aan zet, zodat het kind vrij kan oefenen.
5. **Geen backend, opslag of externe requests.** Voortgang wordt niet bewaard. De tutorial is volledig client-side en de dependencies worden lokaal gebundeld.
6. **Toegankelijke, kindgerichte UI.** De coördinaten a–h en 1–8 zijn expliciet zichtbaar, knoppen zijn minimaal 44 px hoog en de status wordt via een `aria-live`-regio gemeld.

## Gevolgen

- De repository krijgt twee runtime-dependencies: `chess.js` en `react-chessboard`. Beide worden via de bestaande Vite-build gebundeld.
- De tutorial gebruikt geen check-, checkmate- of koningsregels. Voor een volledig schaakspel zijn nieuwe levels met koningen en normale FEN-validatie nodig.
- De levelconfiguratie is uitbreidbaar: een nieuw level voegt een FEN, een doelveld en een stuk toe aan `libs/features/chess-tutorial/model/levels.ts`.
- De bestaande CSP en het verbod op externe requests blijven ongewijzigd.
