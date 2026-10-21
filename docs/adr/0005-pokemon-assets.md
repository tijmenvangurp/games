# ADR 0005: Pokémon-assets lokaal gebundeld

- **Status:** Accepted (bijgewerkt op 2026-10-21: cries verwijderd, zie onderaan)
- **Datum:** 2026-10-17
- **Vervangt:** [ADR 0003](0003-originele-spelassets.md)

## Context

De eigenaar wil van Monster Memory een Pokémon Memory maken voor jonge kinderen. Dezelfde lokale assets worden gebruikt door de quiz **Wie is deze Pokémon?**. De game gebruikt officiële artwork, cries en animated sprites. Die bestanden staan al publiek online, maar de app mag ze niet tijdens het spelen bij een derde partij ophalen:

- `apps/games/public/_headers` heeft een strikte CSP (`img-src 'self' data:`, `connect-src 'none'`).
- De app moet offline en zonder tracking blijven werken.
- Een runtime-koppeling zou het IP-adres van bezoekers naar een externe host sturen.

De eigenaar heeft daarom expliciet goedgekeurd dat de assets één keer worden gedownload en lokaal in deze openbare repository worden gebundeld.

## Beslissing

1. **Alle 151 Generatie 1-Pokémon** hebben lokale artwork, een lokale cry en een lokaal animated sprite in `apps/games/public/pokemon/`.
2. **Geen runtime-API en geen CDN.** De app bouwt paden als `/pokemon/artwork/{id}.webp`, `/pokemon/cries/{slug}.mp3` en `/pokemon/animated/{slug}.gif`. Er gaat tijdens het spelen geen request naar een externe host.
3. **De CSP blijft ongewijzigd.** Audio valt onder `default-src 'self'`; afbeeldingen vallen onder `img-src 'self' data:`.
4. **De Pokédex is offline data.** `libs/entities/memory/model/config.ts` bevat de 151 ID's, namen en bestandsslugs. Er is geen package of API nodig om een naam op te zoeken.
5. **De moeilijkheidsgraden blijven bestaan.** Standaard start een potje met 8 paren (16 kaarten). Makkelijk gebruikt 6 paren, moeilijk 10.
6. **Na een match** toont de kaart de animated sprite en speelt de cry. Bij het omdraaien speelt de cry van de gekozen Pokémon.

## Bronnen

De gebruikte bestanden zijn afkomstig van deze publieke bronnen:

- **Artwork:** [PokeAPI/sprites — official-artwork](https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork), gedownload via `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png` en lokaal verkleind naar 256 × 256 WebP.
- **Cries (primaire bron):** [PokeAPI/cries — latest](https://github.com/PokeAPI/cries/tree/main/cries/pokemon/latest), URL-patroon `{id}.ogg`.
- **Cries (gebruikt bestand):** [Pokémon Showdown audio/cries](https://play.pokemonshowdown.com/audio/cries/), URL-patroon `{slug}.mp3`. Gekozen voor consistente MP3-bestanden en brede browserondersteuning.
- **Animated sprites:** [Pokémon Showdown sprites/ani](https://play.pokemonshowdown.com/sprites/ani/), URL-patroon `{slug}.gif`.
- **Data en namen:** [PokéAPI](https://pokeapi.co/) is eenmalig gebruikt om de 151 namen en slugs te controleren.
- **Overwogen packages:** [`pokemon`](https://www.npmjs.com/package/pokemon), [`pokedex-promise-v2`](https://www.npmjs.com/package/pokedex-promise-v2) en [`@favware/graphql-pokemon`](https://www.npmjs.com/package/@favware/graphql-pokemon). Deze zijn niet toegevoegd: ze leveren data, geen artwork of cries, en de lijst van 151 namen is klein genoeg om lokaal te bewaren.
- **Showdown-project:** [smogon/pokemon-showdown](https://github.com/smogon/pokemon-showdown).

## Auteursrecht en merken

Pokémon en alle bijbehorende namen, personages en afbeeldingen zijn eigendom van Nintendo, Creatures Inc. en GAME FREAK inc. Deze app is een niet-commercieel fanproject zonder officiële band met de rechthebbenden. De eigenaar heeft de risico's van publicatie in een openbare repository expliciet geaccepteerd. Als de rechthebbenden bezwaar maken, moeten de assets worden verwijderd en moet ADR 0003 weer gaan gelden.

## Gevolgen

- De repository groeit met ongeveer 12 MB aan assets (2,2 MB artwork, 1,5 MB cries, 8,2 MB animated sprites).
- De app blijft volledig statisch, offline bruikbaar en vrij van externe requests tijdens het spelen.
- De bronlinks hierboven dienen als attributie en herkomstbewijs.
- Nieuwe assets toevoegen vereist een bron, een lokale bestandsnaam en een update van deze ADR.

## Update 2026-10-21: cries vervangen door app-geluidjes

De eigenaar vond de ingebouwde Pokémon-cries niet mooi genoeg. Na het beluisteren van alternatieven (PokeAPI `latest` en `legacy`, zachter afspelen en dieper afspelen) is gekozen voor de gesynthetiseerde geluidjes die de rest van de app al gebruikt.

1. **Geen Pokémon-audiobestanden meer.** De 151 MP3's in `apps/games/public/pokemon/cries/` zijn verwijderd, samen met `pokemonCrySrc` en `usePokemonCry`. De repository wordt daarmee ongeveer 1,5 MB kleiner.
2. **Memory** speelt `tap` bij een omgedraaide kaart, `match` bij een gevonden paar en `win` bij de laatste pair. **Wie is deze Pokémon?** speelt `match` bij een goed antwoord en `tap` bij de knop naar de volgende vraag.
3. **Eén geluidssysteem.** Alle feedback loopt via `playSound` uit `@shared/lib`, respecteert de geluidstoggle en gebruikt geen externe bestanden.
4. **Artwork en animated sprites blijven ongewijzigd.** De bronnen en licentieafweging hierboven gelden nog voor die twee sets.

De CSP en de offline-eigenschappen veranderen niet.
