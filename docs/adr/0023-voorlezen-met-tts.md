# ADR 0023: Voorlezen met vooraf gegenereerde TTS

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Kader:** [ADR 0001](0001-publieke-statische-spellen-app.md), [ADR 0017](0017-letterklanken-en-audio.md), [onderzoek voorlezen](../research/2026-10-19-voorlezen-met-tts.md) en [plan voorlezen](../plans/2026-10-19-voorlezen-in-alle-games.md)

## Context

Veel games vragen een kind om tekst te lezen: de opdracht, de vraag, de antwoordopties en de feedback. Een kind dat nog niet leest kan daardoor niet zelfstandig spelen. De app heeft al twee bewezen audiopijplijnen: Frans met de Tom-stem en Letterpret met de Nathalie-stem. Beide werken met lokale bestanden en zonder runtime-TTS.

De app is publiek en statisch. De CSP staat geen externe requests toe, en de app heeft geen backend. Daarom is de browser-`speechSynthesis` geen betrouwbare basis: stemmen verschillen per toestel, sommige stemmen synthetiseren via een netwerkdienst en de uitspraak is niet reviewbaar.

## Beslissing

1. **Vooraf gegenereerde, lokale audio.** Spraak staat als MP3 in `apps/games/public/audio/nl/<folder>/<id>.mp3` en wordt gecommit. De app doet tijdens het spelen geen TTS-aanroep en geen externe request.
2. **Eén gedeelde speler.** `libs/shared/lib/speech.ts` beheert één `HTMLAudioElement`, een wachtrij, stopgedrag, de voorkeur en `useAutoSpeech`. `SpeechButton`, `SpokenText` en `SpeechToggle` staan in `shared/ui`. Nieuwe games bouwen geen eigen audio-element.
3. **Eén stem.** Nederlands gebruikt `speaches-ai/piper-nl_BE-nathalie-medium` (voice `nathalie`, CC0), dezelfde stem als Letterpret, met een snelheid van ongeveer 0,95. Alleen als Nathalie bij langere zinnen duidelijk tegenvalt, vallen we terug op `nl_NL-pim-medium` of `nl_NL-ronnie-medium`.
4. **Elke game verklaart expliciet hoe het met spraak omgaat.** `gameCatalog` heeft per beschikbare game een `speech`-verklaring: een groep, `visual`, `pending` of `legacy`. Een test (`speech-coverage`) controleert dit. Zo is stilte een bewuste keuze en geen vergeetfout.
5. **De generator ontdekt catalogi zelf.** Elke game of elk domein met spraak heeft een `model/audio.ts` met `speechGroups`. `scripts/generate-audio.ts` scant `libs/**/model/audio.ts`; er is geen centrale lijst. `scripts/audio.lock.json` bewaart per id een hash van de gesproken tekst.
6. **CI controleert, genereert niet.** `pnpm run audio:check` controleert bestanden, MP3-headers en teksthashes. `tests/node/speech-audio.test.ts` en `tests/node/speech-coverage.test.ts` draaien mee in de kwaliteitsgate. De TTS-server is alleen nodig bij het lokaal genereren.
7. **Automatisch voorlezen pas na een tik.** `useAutoSpeech` wacht op de eerste pointer- of toetsgebeurtenis. Elk gesproken element heeft een herhaalknop. De zichtbare tekst blijft altijd staan, zodat dove en slechthorende kinderen en schermlezergebruikers niets verliezen.
8. **Voorlezen is apart te bedienen.** `SpeechToggle` staat naast de bestaande geluidseffecten. De voorkeur staat in `games.speech.v1`, los van `games.sound.v1`.

## Gevolgen

- Een nieuwe game kan niet zonder spraakverklaring worden toegevoegd; de coverage-test en `audio:check` bewaken dit.
- De generator en de UI lezen dezelfde catalogus. Een tekstwijziging zonder nieuwe audio faalt in CI.
- Audio is lazy: het zit niet in de JavaScript-bundel en vertraagt de eerste paginalading niet.
- De repository groeit met de audio. De huidige Nederlandse set is ongeveer 2,5 MB voor 222 fragmenten. Audio cachet één dag; bij een nieuwe stem is een oude clip daardoor maximaal één dag zichtbaar.
- De eerste generatie vraagt de private TTS-helper. Daarna is alles lokaal en statisch.
- Uitspraakoverrides en de luistertest op echte toestellen blijven menselijk werk.
- De CSP en de regel “geen externe requests” blijven ongewijzigd.
- De Franse en Letterpret-audiospeler kunnen later op dezelfde gedeelde speler worden aangesloten; dat is een migratie, geen nieuwe architectuur.

## Afgewezen alternatieven

- **Web Speech API:** stemmen en netwerkgedrag verschillen per toestel; uitspraak is niet reviewbaar en niet deterministisch.
- **TTS-server tijdens het spelen:** vraagt een backend of externe request en breekt de statische/privacyregels.
- **Menselijke opnames voor alle games:** betere kwaliteit, maar honderden fragmenten inspreken en onderhouden is nu niet haalbaar.
- **Alle UI-tekst automatisch voorlezen:** te veel spraak, te veel ruis en een slechtere ervaring voor kinderen die al lezen. We spreken de opdracht, vraag, antwoordopties en feedback.
