## Deployment

De app draait als Cloudflare Worker met static assets (`wrangler.jsonc`, workernaam `games`). **Cloudflare Workers Builds** bouwt en deployt bij elke push naar `main`; er zijn geen GitHub-secrets of API-tokens nodig.

Eenmalig in Cloudflare instellen via **Workers & Pages → `games` → Settings → Build**:

| Instelling | Waarde |
| --- | --- |
| Git-repository | `tijmenvangurp/games` |
| Productiebranch | `main` |
| Root directory | `/` |
| Build command | `pnpm run build` |
| Deploy command | `npx wrangler deploy` |
| Buildvariabele `NODE_VERSION` | `24` |
| Buildvariabele `PNPM_VERSION` | `12.9.1` |

De workernaam in het dashboard moet exact `games` zijn, anders weigert de build. Na een geslaagde build staat de nieuwste versie op <https://games.tijmenvangurp.workers.dev/>.

GitHub Actions draait alleen nog de Quality-gate; de deploy-workflow is verwijderd zodat er één deploypad is. `pnpm deploy` blijft beschikbaar voor een handmatige deploy vanaf een machine met Cloudflare-toegang.
