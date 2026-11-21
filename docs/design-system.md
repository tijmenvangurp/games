# Design systeem

Dit document beschrijft de visuele basis van Spellen. Het doel is rust en tactiele kwaliteit:
kinderen hoeven niet door een regenboog aan decoratie te navigeren. Kleur, diepte en beweging
hebben altijd een functie.

## Principes

1. **Rustige basis (Elevated Paper Craft).** Warm ivoor papier, diepe inkt, subtiele papierdiepte
   en één indigo-accentkleur. Geen gradients of losse achtergronddecoratie.
2. **Kleur is betekenis.** Het accent is voor actie en selectie. Groen, amber en rood zijn
   gereserveerd voor goed, hint en fout — elk met een zacht vlak (`*-soft`) en een contrastrijke
   inktkleur (`*-ink`).
3. **Eén icoonfamilie.** Spelidentiteit en UI gebruiken dezelfde lijnstijl (`lucide-react` en
   `@phosphor-icons/react` via `@shared/ui`). Emoji's zijn alleen leerinhoud of spelersavatars,
   nooit UI-chrome.
4. **Eén set type-safe componenten.** Dezelfde shell, panelen, knoppen, keuzekaarten,
   statusbalken, dialogen, voortgangsbalken en uitklappanelen in elk spel.
5. **Vieren mag, maar gericht.** Confetti en sparkles verschijnen bij een overwinning of
   mijlpaal, niet als permanente versiering.
6. **Beweging is feedback.** Kort en functioneel; geen constante animaties. Respecteer altijd
   `prefers-reduced-motion`.

## Type-safe CSS & Design Tokens

De ontwerpwaarden leven als één enkele, type-safe bron van waarheid in
`libs/shared/ui/tokens.css.ts` (Vanilla Extract, zero-runtime tijdens build):

- `vars` (`createGlobalThemeContract`) publiceert alle CSS custom properties op `:root` met
  vaste namen (`--background`, `--primary`, `--ds-radius-lg`, `--ds-shadow-panel`, enz.).
- `apps/games/src/app/styles/index.css` koppelt `@theme inline` aan dezelfde CSS-variabelen,
  zodat zowel Vanilla Extract (`vars.color.primary`) als Tailwind-utilities (`bg-primary`,
  `bg-primary-soft`, `text-success-ink`) uit precies dezelfde tokens lezen.
- Alle component-recipes (`@vanilla-extract/recipes`) schrijven in `globalLayer("components")`.
  Daardoor staan ze boven `@layer base` en onder `@layer utilities`, zodat layout-overrides via
  `className` (samengesteld met `cn()`) altijd schoon werken zonder `!important`.

| Token                                        | Gebruik                                                       |
| -------------------------------------------- | ------------------------------------------------------------- |
| `vars.color.background` / `backgroundSubtle` | Warm ivoor papier en rustige ingelaten vlakken                |
| `vars.color.foreground` / `mutedForeground`  | Diepe inkt en secundaire tekst (≥ 4,5:1 contrast)             |
| `vars.color.card` / `cardElevated`           | Panelen, kaarten en zwevende dialogen                         |
| `vars.color.muted`                           | Rustige vlakken en uitgeschakelde staten                      |
| `vars.color.border` / `borderStrong`         | Hairline-randen en tactiele hover-randen                      |
| `vars.color.primary` / `primarySoft`         | Actie, selectie, actieve staat en zachte selectietint         |
| `vars.color.success` / `successSoft` / `Ink` | Goed, gevonden, opgelost                                      |
| `vars.color.warning` / `warningSoft` / `Ink` | Hint, aandacht, bijna                                         |
| `vars.color.danger` / `dangerSoft` / `Ink`   | Fout, conflict, verloren                                      |
| `vars.color.pawnRed` … `pawnPink`            | Pionkleuren voor bordspellen (los van feedbackkleuren)        |
| `vars.color.playerOne` / `playerTwo`         | Vaste kleuren voor Vier op een Rij                            |
| `vars.color.parchmentBg` … `parchmentInk`    | Perkament-palet voor historische bordspellen zoals Ganzenbord |
| `vars.radius.sm` … `xl` / `pill`             | Vaste radiusschaal: `8px`, `12px`, `16px`, `20px`, pil        |
| `vars.shadow.tactile` / `panel` / `dialog`   | Fysieke papierdiepte zonder harde blokschaduwen               |
| `vars.motion.fast` / `normal` / `slow`       | Consistente duur en `easeOut`-curve                           |

Typografie: één systeem-sans (`ui-rounded` / systeem-sans) voor tekst, een systeem-serif voor
schermkoppen en spelnamen (`font-display`), en `tabular-nums` voor scores en tellers. Geen
externe fonts.

Spelerskleuren zijn voor speelstukken, niet voor UI-status. Een actieve speler krijgt daarom
neutrale nadruk (een donkere rand en het `muted`-vlak) in plaats van `--primary`; groen en amber
blijven feedback. Het feedback-rood (`--danger`) is een eigen, donkerder token dan de spelerskleur,
zodat een rode schijf nooit als fout leest.

## Componenten (`@shared/ui`)

- `GameShell` — vaste paginakop met terug, geluid, spraak en eventueel nieuw spel; acties lijnen
  altijd rechts uit.
- `PageHeader` — serif titel met rustige subtitel over de volledige breedte.
- `GameMenu` — spelkaarten in een rustig raster met lokale thumbnail, `GameIcon`, serif spelnaam
  en korte uitleg. De hele kaart is de link; er staat geen extra "Openen"-regel.
- `Panel` — type-safe surface (`card`, `subtle`, `elevated`, `dashed`) met vaste padding- en
  interactie-varianten; vervangt alle losse `.game-panel`- en kaart-divs.
- `SetupPanel` — uniforme instellingenkaart voor alle startschermen met serif titel, optionele
  subtitel, score-balk en `SetupActions`.
- `TextInput` — type-safe tekstinvoer met vaste hoogte (44 px), rand en focusring.
- `Button` — `default`, `outline`, `soft`, `ghost`, `success` en `danger` met tactiele diepte en
  vaste focusring.
- `ChoiceCard` / `OptionPicker` — keuze met label, optioneel symbool of icoon (`leading`),
  toelichting en `size="compact"` voor tekstkeuzes.
- `AnswerOption` — uniforme antwoordknop voor quizspellen (`default`, `correct`, `wrong`, `warn`,
  `muted`) met semantische feedbackkleuren en icoon.
- `StatusBanner` — gedeelde status- en feedbackbalk met semantische toon (`neutral`, `primary`,
  `success`, `warning`, `danger`), optioneel icoon en actie.
- `Dialog` — toegankelijk modaal venster met gedeelde backdrop, Escape-afhandeling,
  `prefers-reduced-motion` en `size`/`tone`-varianten (`CelebrationDialog` bouwt hierop voort).
- `ProgressBar` — toegankelijke voortgangsbalk (`role="progressbar"`) met `primary` en `success`.
- `ScoreHeader` — gedeelde ronde-HUD met voortgangstekst, sterren en reeks (`tabular-nums`).
- `Badge` — compacte pil voor status, labels en aantallen (`tabular-nums`).
- `Disclosure` — uitklappaneel (`<details>`) met draaiende chevron en 44 px tikdoel.
- `GameIcon` — Phosphor-icoon per spel of les.
- `ChessBoard` — schaakbord met de coördinaten buiten de velden: rijnummers links, kolomletters
  onder. Draait mee met de bordstand.
- `CelebrationDialog` & `Confetti` — afsluiting met optionele confetti bij een echte overwinning.

## Spraak

- `GameShell` toont `SpeechToggle` naast `SoundToggle` als de game spraak heeft. Voorlezen en
  geluidseffecten zijn apart te bedienen.
- `SpeechButton` herhaalt één spraakregel; `SpokenText` toont tekst en een sprekerknop.
- `useAutoSpeech` leest een nieuwe opdracht of feedback automatisch voor, maar pas na de eerste tik.
- Elke game met spraak heeft een `model/audio.ts` met `speechGroups`. De generator ontdekt die zelf.
- Nieuwe games verklaren in `gameCatalog` hoe ze met spraak omgaan: een groep, `visual`,
  `pending` of `legacy`.
- `pnpm run audio:check` en de `speech-coverage`-test bewaken dat er geen game zonder audio of
  expliciete keuze bijkomt.

## Spelregels

- Gebruik in nieuwe schermen `GameShell`, `Panel`, `Button`, `OptionPicker`, `AnswerOption`,
  `StatusBanner`, `Dialog`, `ProgressBar`, `Badge` en `Disclosure`.
- Gebruik geen losse Tailwind-kleurpaletten (`bg-slate-*`, `bg-emerald-*`, `bg-rose-*`, enz.) of
  hex-kleuren in UI-chrome; gebruik de semantische tokens uit `tokens.css.ts`.
- Gebruik `text-primary` voor actie en selectie, niet voor decoratie.
- Gebruik `success`, `warning` en `danger` alleen voor hun betekenis.
- Voeg geen nieuwe emoji toe aan UI-chrome. Emoji's mogen wel in leerinhoud of spelersavatars staan.
- Nieuwe spellen krijgen een item in `GameIcon` en een regel in `gameCatalog`.
- Spelthumbnails staan lokaal in `apps/games/public/thumbnails` (800 × 500, JPEG) met een
  contenthash in de bestandsnaam. De stijl, de prompts per spel en `pnpm run thumbnails` staan in
  `thumbnails.md`.
- Houd touch-targets op minimaal 44 px en respecteer `pt-safe`/`pb-safe`.

## Iconen

Speliconen komen uit [Phosphor Icons](https://phosphoricons.com) (`@phosphor-icons/react`, MIT)
en UI-iconen uit [Lucide](https://lucide.dev) (`lucide-react`, ISC). De gebruikte iconen worden
lokaal gebundeld; er gaat geen request naar een externe dienst.
