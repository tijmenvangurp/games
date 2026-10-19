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
- `adr/0011-woordzoeker-richtingen.md` — de eigen generator en de richtingniveaus van de woordzoeker.
- `adr/0012-optionele-accounts-en-sync.md` — optionele ouderaccounts, kindprofielen en sync zonder loginmuur.
- `adr/0013-privacy-optionele-accounts.md` — dataminimalisatie, toestemming, bewaartermijnen en verwerkers.
- `adr/0014-schaaktutorial-een-opdracht-per-scherm.md` — minder tekst, een coachbubbel en een visuele hint in de schaaktutorial.
- `adr/0015-schaakpuzzels-uitbreiding.md` — 90 extra Lichess-puzzels, mat-in-twee, tactieken en meer stukvariatie.
- `adr/0016-schaakpuzzeloverzicht.md` — het puzzeloverzicht en lokaal bewaarde opgeloste puzzels.
- `adr/0017-letterklanken-en-audio.md` — CC0-klanken uit Rhasspy Nathalie en prototype-woordaudio, te vervangen vóór lancering.
- `research/2026-10-17-game-stack-dependencies.md` — onderzoek naar drag-and-drop, animatie en geluid binnen de statische/CSP-regels.
- `research/2026-10-17-arrows-puzzle-escape.md` — mechanica, levelvorm en implementatiemodel voor de echte _Arrows – Puzzle Escape_-lijnenmaze.
- `research/2026-10-18-woordzoeker-libraries.md` — vergelijking van woordzoeker-bibliotheken en de keuze voor `@aydee-app/word-search`.
- `research/2026-10-18-frans-luisterspel.md` — bestaande content, TTS-stemmen en spelconcept voor een Frans luisterspel met flipcards en sorteren.
- `research/2026-10-18-letters-leren-basisschool.md` — methodiek voor letters leren in groep 1–3, de lettervolgordes van VLL en Lijn 3, en ontwerpimplicaties voor een letter-spel.
- `research/2026-10-18-letterdidactiek-en-spelletjes.md` — didactische principes, klassenspelletjes, digitale letter-apps en concrete spelmodi voor een letter-spel.
- `plans/2026-10-18-franse-lessen.md` — plan om de Franse lessen schaalbaar te maken met een curriculum, validator, dynamische route en audio-check.
- `research/2026-10-18-auth-backend-betterauth.md` — onderzoek naar Better Auth, een Workers/D1-backend en gefaseerde sync van voortgang binnen de statische/CSP-regels.
- `ideas/sudoku-speelser.md` — backlog met kindvriendelijke sudoku-ideeën en de gekozen eerste stap.
- `ideas/letter-spelletjes.md` — spelconcepten voor een letter-spel: de Letterronde, zes engines en een gefaseerde roadmap.
- `ideas/spelideeen.md` — verzamelde educatieve spelideeën, prioriteiten en aandachtspunten.

Nieuwe architectuur-, privacy-, routing- of deploymentbeslissingen krijgen een eigen ADR in `adr/`.
