# Architecture Decision Records

Een ADR legt een beslissing vast die moeilijk terug te draaien is, die zonder
context verrassend is en die uit een echte afweging komt. Kopieer
[`template.md`](template.md) en nummer door.

| ADR                                                    | Titel                                                         | Status   |
| ------------------------------------------------------ | ------------------------------------------------------------- | -------- |
| [0001](0001-publieke-statische-spellen-app.md)         | Publieke spellen-app in een aparte statische repository       | Accepted |
| [0002](0002-kwaliteitsgate.md)                         | Dezelfde kwaliteitsgate als homelab-control                   | Accepted |
| [0003](0003-originele-spelassets.md)                   | Originele spelassets in plaats van beschermde personages      | Accepted |
| [0004](0004-nx-monorepo.md)                            | Nx-monorepo met Feature-Sliced Design                         | Accepted |
| [0005](0005-pokemon-assets.md)                         | Pokémon-assets lokaal gebundeld                               | Accepted |
| [0006](0006-schaaktutorial.md)                         | Schaaktutorial met chess.js en react-chessboard               | Accepted |
| [0007](0007-schaaktutorial-uitbreiding.md)             | Schaaktutorial uitbreiden naar de complete basis              | Accepted |
| [0008](0008-schaakpuzzels.md)                          | Schaakpuzzels uit de Lichess-database                         | Accepted |
| [0009](0009-woordzoeker.md)                            | Woordzoeker met een kleine generator-bibliotheek              | Accepted |
| [0010](0010-tafel-topper.md)                           | Tafel Topper als lokale reken trainer                         | Accepted |
| [0011](0011-woordzoeker-richtingen.md)                 | Eigen woordzoeker-generator met richtingniveaus               | Accepted |
| [0012](0012-optionele-accounts-en-sync.md)             | Optionele accounts en gesynchroniseerde voortgang per profiel | Accepted |
| [0013](0013-privacy-optionele-accounts.md)             | Privacy en gegevensverwerking voor optionele accounts         | Accepted |
| [0014](0014-schaaktutorial-een-opdracht-per-scherm.md) | Schaaktutorial met één opdracht per scherm                    | Accepted |
| [0015](0015-schaakpuzzels-uitbreiding.md)              | Schaakpuzzels uitbreiden met mat-in-twee en meer stukken      | Accepted |
| [0016](0016-schaakpuzzeloverzicht.md)                  | Schaakpuzzeloverzicht met lokale voortgang                    | Accepted |
| [0017](0017-letterklanken-en-audio.md)                 | Letterklanken en prototype-woordaudio voor het letterspel     | Accepted |
| [0018](0018-vlaggenspel.md)                            | Vlaggenspel met lokale vlaggen en landennamen                 | Accepted |
| [0019](0019-wereldkaart.md)                            | Wereldkaart met d3-geo en Natural Earth                       | Accepted |
| [0020](0020-kaartpuzzel.md)                            | Kaartpuzzel als tweede speelwijze van Vlaggenreis             | Accepted |
| [0021](0021-provinciegeometrie.md)                     | Provinciegeometrie uit Natural Earth                          | Accepted |
| [0022](0022-schaakbord-tikken-is-kijken.md)            | Schaakbord — tikken is kijken, slepen is zetten               | Accepted |
| [0023](0023-voorlezen-met-tts.md)                      | Voorlezen met vooraf gegenereerde TTS                         | Accepted |
| [0024](0024-schaakpartij-en-lokale-stockfish.md)       | Schaakpartij, hub en lokale Stockfish                         | Accepted |
| [0025](0025-vier-op-een-rij.md)                        | Vier op een Rij, samen of tegen de computer                   | Accepted |
| [0026](0026-adaptief-niveaumodel.md)                   | Adaptief niveaumodel en foutvriendelijke feedback             | Accepted |
| [0027](0027-schaakcoordinaten-buiten-het-bord.md)      | Schaakcoördinaten buiten het bord                             | Accepted |
| [0028](0028-ganzenbord.md)                             | Ganzenbord met een hergebruikte klassieke kaart               | Accepted |
| [0029](0029-agent-harness.md)                          | Gedeelde agent-harness met skills en MCP's                    | Accepted |

Nieuwe beslissingen krijgen een volgend nummer. Werk na het toevoegen zowel
deze index als `docs/README.md` bij.
