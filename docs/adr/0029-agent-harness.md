# ADR 0029: Gedeelde agent-harness met skills en MCP's

- **Status:** Accepted
- **Datum:** 2026-11-07
- **Bouwt voort op:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0004](0004-nx-monorepo.md)

## Context

De repository wordt door meerdere personen en agents bewerkt. De maintainer
gebruikt lokaal een set skills en MCP-servers die niet in de repo staan. Daardoor
krijgt een andere contributor niet dezelfde werkwijze, kent hij de kwaliteitsgate
niet en moet hij dezelfde fouten opnieuw uitzoeken.

De repo is openbaar. Persoonlijke integraties, tokens, hostnames en
accountgegevens mogen hier niet terechtkomen. De app zelf moet statisch blijven
en tijdens het spelen geen externe requests doen.

## Beslissing

1. **Projectspecifieke skills staan in de repo.** De bron is
   `.apm/skills/<naam>/SKILL.md`; APM deployt ze naar `.agents/skills/` voor
   OpenCode en Codex en naar `.claude/skills/` voor Claude Code. Ze beschrijven
   alleen werk dat bij Spellen hoort: een spel toevoegen, de kwaliteitsgate, UI,
   audio, dependencies, review en ADR's.
2. **Upstream-skills worden via APM beheerd.** `apm.yml` declareert de bronnen
   en de geselecteerde skills; `apm.lock.yaml` pint commits, hashes en
   gedeployde bestanden. `apm install --only apm` deployt naar
   `.agents/skills/` en `.claude/skills/`.
3. **Dezelfde skills en MCP's gelden voor OpenCode, Claude Code en Codex.**
   `targets` staat op alle drie. Claude Code leest `CLAUDE.md`,
   `.claude/skills/` en `.mcp.json`; Codex leest `AGENTS.md`,
   `.agents/skills/` en `.codex/config.toml`. OpenCode leest `AGENTS.md`,
   `.agents/skills/` en `opencode.jsonc`.
4. **Persoonlijke en optionele MCP's blijven globaal.** `cloudflare-api`,
   `firecrawl` en andere accountgebonden servers horen in de globale config van
   de gebruiker, niet in deze repo.
5. **MCP's zijn ontwikkeltooling, geen app-runtime.** De app blijft statisch en
   doet geen externe requests. `CONTRIBUTING.md` beschrijft per server welke data
   de machine verlaat.
6. **Geen geheimen of privépaden.** Skills en docs bevatten geen tokens,
   `.env`-waarden, interne hostnames, netwerknamen, IP-adressen of persoonsgegevens.
   Privé-workflows krijgen een publieke, veilige variant of een verwijzing naar
   de maintainer.
7. **Licenties en herkomst zijn vastgelegd.** De gebruikte upstream-bronnen zijn
   MIT (mattpocock/skills) en Apache 2.0 (cloudflare/skills); de teksten staan in
   `LICENSES/`. APM registreert de gedeclareerde licenties in de lockfile.
8. **OpenCode MCP's verhuizen later naar APM.** APM schrijft de MCP's al voor
   Claude Code (`.mcp.json`) en Codex (`.codex/config.toml`), maar APM 0.35
   schrijft voor OpenCode nog de V1-vorm die OpenCode V2 niet leest. Tot
   [microsoft/apm#3112](https://github.com/microsoft/apm/issues/3112) in een
   release zit, blijven de OpenCode MCP's daarom in `opencode.jsonc`. Daarna
   verhuist ook OpenCode naar de APM-uitvoer en vervalt de handmatige config.

## Gevolgen

- Een clone heeft direct dezelfde skills; alleen `corepack pnpm install`,
  `corepack pnpm run harness:install` en eventueel een OAuth-login voor
  Context7 zijn nodig.
- De repo groeit met ongeveer 350 KB aan skillbestanden. Updaten gaat via
  `apm update --yes` en `apm install --only apm --no-policy`, waarna de diff
  wordt gecontroleerd en gecommit.
- Een upstream-update kan een lokale aanpassing overschrijven. Eigen regels
  horen daarom in een `spellen-*`-skill, niet in een upstream-skill.
- Claude Code en Codex krijgen de MCP's uit APM; OpenCode staat nog handmatig
  in `opencode.jsonc` tot APM OpenCode V2 ondersteunt. Dat voorkomt een eigen
  vertaalscript.
- Context7 verstuurt zoekvragen en codefragmenten naar context7.com. Daarom
  staan er geen secrets of kindgegevens in een prompt.
- Nx-telemetrie staat uit. Fallow en Nx mogen niet parallel draaien vanwege de
  `.fallow/`-race.
- De app-CSP, de Worker en de deployroute veranderen niet.

## Bronnen

- [OpenCode skills](https://opencode.ai/v2/docs/skills)
- [OpenCode MCP-servers](https://opencode.ai/v2/docs/mcp-servers)
- [Agent Package Manager](https://microsoft.github.io/apm/) (MIT)
- [microsoft/apm#3112](https://github.com/microsoft/apm/issues/3112) en
  [PR #3414](https://github.com/microsoft/apm/pull/3414) — OpenCode V2 MCP-vorm
- [mattpocock/skills](https://github.com/mattpocock/skills) (MIT)
- [cloudflare/skills](https://github.com/cloudflare/skills) (Apache 2.0)
