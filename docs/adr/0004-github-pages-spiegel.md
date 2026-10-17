# ADR 0004: Tijdelijke GitHub Pages-spiegel

- **Status:** Accepted (tijdelijk)
- **Datum:** 2026-10-17

## Context

De Cloudflare Worker `games` serveert nog een oude sudoku-only bundel, terwijl `main` al Sudoku, "Waar is Wobbel?" en Monster Memory bevat. De GitHub Actions-deploy naar Cloudflare wordt overgeslagen omdat de Cloudflare-secrets ontbreken. De Cloudflare Workers Builds-status is zonder dashboardtoegang niet in te zien, en de eigenaar heeft daar op dit moment geen tijd voor.

## Beslissing

- Publiceer dezelfde statische build tijdelijk ook via **GitHub Pages** op `https://tijmenvangurp.github.io/games/`.
- Gebruik daarvoor de bestaande build met `SITE_BASE=/games/`, een router-basepath en een kopie van `index.html` als `404.html` voor deep links.
- Voeg een meta-CSP en `noindex` toe aan `index.html`, omdat GitHub Pages geen `_headers` ondersteunt.
- Cloudflare blijft de canonieke URL. De spiegel is een noodoplossing en wordt verwijderd zodra de Cloudflare-deploy betrouwbaar werkt.

## Gevolgen

- Er is tijdelijk een tweede openbare URL met dezelfde inhoud.
- De GitHub Pages-versie heeft geen HTTP-headers voor CSP of `noindex`; de meta-tags bieden vergelijkbare beperkingen, maar zonder `frame-ancestors`.
- Er zijn geen extra secrets of externe accounts nodig: GitHub Actions gebruikt het ingebouwde `GITHUB_TOKEN` en OIDC voor Pages.
- Bij een latere opruiming hoeven alleen de Pages-workflow en de Pages-site te worden verwijderd; de app zelf verandert niet.
