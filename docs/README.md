# Documentatie

- `../README.md` — wat de app is, scripts, deployment en privacyregels.
- `tooling.md` — Nx-daemon, cache, Fallow en de bijbehorende permission-regels.
- `adr/0001-publieke-statische-spellen-app.md` — waarom een aparte publieke, statische repository.
- `adr/0002-kwaliteitsgate.md` — dezelfde kwaliteitscontroles als `homelab-control`, inclusief de afwijking rond pnpm `minimumReleaseAge`.
- `adr/0003-originele-spelassets.md` — waarom de games originele personages gebruiken en geen beschermde of externe assets.
- `adr/0004-nx-monorepo.md` — de Nx-monorepo, FSD-grenzen en lokale cache.
- `adr/0005-pokemon-assets.md` — lokale Pokémon-assets en de CSP-afweging.
- `adr/0006-schaaktutorial.md` — de eerste schaaktutorial met chess.js en react-chessboard.
- `adr/0007-schaaktutorial-uitbreiding.md` — waarom de schaaktutorial alle stukken en de eerste speciale regels dekt.
- `adr/0008-schaakpuzzels.md` — de lokale Lichess-puzzelsselectie en de puzzelrunner.
- `adr/0009-woordzoeker.md` — de woordzoeker, de generator-bibliotheek, de formaten en de zoomstand.
- `adr/0010-tafel-topper.md` — de reken trainer, de niveaus, sterren en lokale beste scores.
- `research/2026-10-17-game-stack-dependencies.md` — onderzoek naar drag-and-drop, animatie en geluid binnen de statische/CSP-regels.
- `research/2026-10-17-arrows-puzzle-escape.md` — mechanica, levelvorm en implementatiemodel voor de echte _Arrows – Puzzle Escape_-lijnenmaze.
- `research/2026-10-18-woordzoeker-libraries.md` — vergelijking van woordzoeker-bibliotheken en de keuze voor `@aydee-app/word-search`.
- `research/2026-10-18-frans-luisterspel.md` — bestaande content, TTS-stemmen en spelconcept voor een Frans luisterspel met flipcards en sorteren.
- `ideas/sudoku-speelser.md` — backlog met kindvriendelijke sudoku-ideeën en de gekozen eerste stap.
- `ideas/spelideeen.md` — verzamelde educatieve spelideeën, prioriteiten en aandachtspunten.

Nieuwe architectuur-, privacy-, routing- of deploymentbeslissingen krijgen een eigen ADR in `adr/`.
