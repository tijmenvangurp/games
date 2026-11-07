# ADR 0029: Gedeelde agent-harness met skills en MCP's

- **Status:** Accepted
- **Datum:** 2026-11-07
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0004](0004-nx-monorepo.md)

## Context

De repository wordt door meerdere personen en agents bewerkt. De eigenaar
gebruikt lokaal een set skills en MCP-servers die niet in de repo staan. Daardoor
krijgt een andere contributor niet dezelfde werkwijze, kent hij de kwaliteitsgate
niet en moet hij dezelfde fouten opnieuw uitzoeken.

De repo is openbaar. Privé-knowledgebases, TTS-endpoints, Telegram-bots en
hostnames mogen hier niet terechtkomen. De app zelf moet statisch blijven en
tijdens het spelen geen externe requests doen.

## Beslissing

1. **Projectspecifieke skills staan in de repo.** Ze leven in
   `.opencode/skills/<naam>/SKILL.md` en beschrijven alleen werk dat bij Spellen
   hoort: een spel toevoegen, de kwaliteitsgate, UI, audio, dependencies, review
   en ADR's.
2. **Upstream-skills worden lokaal geïnstalleerd en gecommit.** De inhoud staat
   in `.agents/skills/`, de herkomst en hashes in `skills-lock.json`. OpenCode
   leest beide mappen automatisch; `.opencode/skills` heeft voorrang.
3. **Alleen overdraagbare MCP's staan in `opencode.jsonc`:** `fallow`, `nx` en
   `context7`. `fallow` en `nx` draaien lokaal; `context7` gebruikt OAuth en
   heeft geen key in de repo.
4. **Private en optionele MCP's blijven globaal.** `cloudflare-api`,
   `firecrawl`, een privé-knowledgebase en TTS/Telegram-tools horen in de
   globale config van de eigenaar, niet in deze repo.
5. **MCP's zijn ontwikkeltooling, geen app-runtime.** De app blijft statisch en
   doet geen externe requests. `docs/agents.md` beschrijft per server welke data
   de machine verlaat.
6. **Geen geheimen of privépaden.** Skills en docs bevatten geen tokens,
   `.env`-waarden, hostnames, tailnet-namen, IP-adressen of persoonsgegevens.
   Privé-workflows krijgen een publieke, veilige variant of een verwijzing naar
   de eigenaar.
7. **Licenties en herkomst zijn vastgelegd.** De gebruikte upstream-bronnen zijn
   MIT (mattpocock/skills) en Apache 2.0 (cloudflare/skills); de teksten staan in
   `LICENSES/`.

## Gevolgen

- Een clone heeft direct dezelfde skills; alleen `corepack pnpm install` en
  eventueel een OAuth-login voor Context7 zijn nodig.
- De repo groeit met ongeveer 350 KB aan skillbestanden. Updaten gaat via
  `npx skills update -p -y`, waarna de diff wordt gecontroleerd en gecommit.
- Een upstream-update kan een lokale aanpassing overschrijven. Eigen regels
  horen daarom in een `spellen-*`-skill, niet in een upstream-skill.
- Context7 verstuurt zoekvragen en codefragmenten naar context7.com. Daarom
  staan er geen secrets of kindgegevens in een prompt.
- Nx-telemetrie staat uit. Fallow en Nx mogen niet parallel draaien vanwege de
  `.fallow/`-race.
- De app-CSP, de Worker en de deployroute veranderen niet.

## Bronnen

- [OpenCode skills](https://opencode.ai/v2/docs/skills)
- [OpenCode MCP-servers](https://opencode.ai/v2/docs/mcp-servers)
- [mattpocock/skills](https://github.com/mattpocock/skills) (MIT)
- [cloudflare/skills](https://github.com/cloudflare/skills) (Apache 2.0)
- [skills CLI](https://github.com/vercel-labs/skills) (MIT)
