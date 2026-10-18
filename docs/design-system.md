# Design systeem

Dit document beschrijft de visuele basis van Spellen. Het doel is rust: kinderen hoeven niet
door een regenboog aan decoratie te navigeren. Kleur en beweging hebben een functie.

## Principes

1. **Rustige basis.** Ivoor papier, inkt en één accentkleur. Geen gradients of losse
   achtergronddecoratie.
2. **Kleur is betekenis.** Het accent is voor actie en selectie. Groen, amber en rood zijn
   gereserveerd voor goed, hint en fout.
3. **Eén icoonfamilie.** Spelidentiteit en UI gebruiken dezelfde lijnstijl. Emoji's zijn alleen
   nog leerinhoud, bijvoorbeeld een dier in sudoku of een woordbeeld in Frans.
4. **Eén set componenten.** Dezelfde shell, panelen, knoppen en keuzekaarten in elk spel.
5. **Vieren mag, maar gericht.** Confetti en sparkles verschijnen bij een overwinning of
   mijlpaal, niet als permanente versiering.
6. **Beweging is feedback.** Kort en functioneel; geen constante animaties.

## Tokens

De waarden staan in `apps/games/src/app/styles/index.css`.

| Token                            | Gebruik                             |
| -------------------------------- | ----------------------------------- |
| `--background`                   | Ivoor papier achter alles           |
| `--foreground`                   | Inkt voor tekst                     |
| `--card`                         | Panelen en kaarten                  |
| `--muted` / `--muted-foreground` | Rustige vlakken en secundaire tekst |
| `--border`                       | Hairline-randen                     |
| `--primary`                      | Actie, selectie, actieve staat      |
| `--success`                      | Goed, gevonden, opgelost            |
| `--warning`                      | Hint, aandacht, bijna               |
| `--danger`                       | Fout, conflict, verloren            |

Typografie: één systeem-sans voor tekst en een systeem-serif voor schermkoppen en
spelnamen. Geen externe fonts.

## Componenten

- `GameShell` — vaste paginakop met terug, geluid en eventueel nieuw spel.
- `PageHeader` — serif titel met rustige subtitel.
- `GameMenu` — neutrale spelkaarten met één `GameIcon` per spel.
- `game-panel` — gedeelde surface voor setup, HUD en informatieblokken.
- `Button` — primair, outline, ghost en success; vaste focusring.
- `ChoiceCard` / `OptionPicker` — keuze met label, hint en optioneel symbool.
- `GameIcon` — Phosphor-icoon per spel of les.
- `CelebrationDialog` — afsluiting met optionele confetti.
- `Confetti` — alleen bij een echte overwinning.

## Spelregels

- Gebruik in nieuwe schermen `GameShell`, `game-panel` en de gedeelde knoppen.
- Gebruik `text-primary` voor actie en selectie, niet voor decoratie.
- Gebruik `success`, `warning` en `danger` alleen voor hun betekenis.
- Voeg geen nieuwe emoji toe aan UI-chrome. Emoji's mogen wel in leerinhoud staan.
- Nieuwe spellen krijgen een item in `GameIcon` en een regel in `gameCatalog`.
- Houd touch-targets op minimaal 44 px en respecteer `pt-safe`/`pb-safe`.

## Iconen

Speliconen komen uit [Phosphor Icons](https://phosphoricons.com) (`@phosphor-icons/react`,
MIT). De gebruikte iconen worden lokaal gebundeld; er gaat geen request naar een externe
dienst.
