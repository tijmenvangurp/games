# ADR 0014: Schaaktutorial met één opdracht per scherm

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De tutorial uit ADR 0006 en 0007 toonde per les een titel, een beschrijving, een hintkaart, een doelbadge, een statusbalk met uitleg en een levelkiezer met negen volledige titels. Het bord stond daardoor pas na veel tekst in beeld. Jonge kinderen moeten eerst lezen voordat ze kunnen spelen, en de statusbalk verwees na een foute zet naar groene stippen die op dat moment niet zichtbaar waren.

De eigenaar wil dat de tutorial kinderen laagdrempeliger meeneemt in schaakideeën: minder lezen, sneller doen en visueel leren.

## Beslissing

1. **Het bord staat direct onder de leskop.** De leskop bevat alleen het lesnummer, de titel en het stukicoon.
2. **De coachbubbel is de enige opdrachtregel.** Die toont per situatie één korte zin: de opdracht, een aanmoediging, een correctie of de viering. De oude beschrijving, hint en doelbadge vervallen als losse blokken.
3. **Uitleg staat achter "Waarom?".** De langere uitleg en tip blijven beschikbaar, maar worden niet standaard getoond. De levelkiezer staat achter "Kies een les" en gebruikt stukiconen met nummers in plaats van negen titelknoppen.
4. **"Toon zet" wijst één zet visueel aan.** De knop selecteert het lesstuk en markeert één haalbare zet met groene stippen. Na een foute zet blijft het lesstuk geselecteerd, zodat de coach verwijst naar wat het kind wél ziet.
5. **Het doelveld toont een echte ster.** De UI rendert een aria-hidden ster in het doelveld via `squareRenderer`; de ster pulseert zacht en respecteert `prefers-reduced-motion`. Dat vraagt geen externe afbeelding of data-URI.
6. **De eerste torenles is één zet.** Het eerste succes komt direct; de tweezetige route zit in de dame-les.
7. **De pionles voorkomt een dood spoor.** Een zwarte pion blokkeert de rechte vooruitzet, zodat alleen de bedoelde slag naar d3 overblijft en het kind daarna naar de ster kan lopen.
8. **Een onbereikbaar doel stopt de les.** Als de koning in de rokadeles één stap zet, verdwijnt het castlingrecht. De engine markeert de les dan als `stuck`; de coach vraagt om opnieuw te beginnen en slepen wordt uitgeschakeld.
9. **Elke les begint met een kijk-preview.** De engine toont alle legale zetten van het lesstuk als blauwe stippen, voordat het kind hoeft te zetten. De knop "Kijk" zet die preview aan en uit; na een tussenstap verschijnt automatisch de preview van de nieuwe stelling. De stippen zijn ook direct aantikbaar, zodat het kind niet eerst het stuk hoeft te selecteren.
10. **De ster is het doel, niet altijd de volgende zet.** Tik het kind tijdens de preview op de ster terwijl die nog niet bereikbaar is, dan zegt de coach "Nog niet! Kies eerst een blauwe stip." Zo blijft de geleerde tikactie uit les 1 kloppen in de tweezetige lessen.

## Gevolgen

- De eerste les begint met het bord en één zin in plaats van een tekstblok.
- De tutorial heeft geen extra dependency, backend of opslag nodig.
- Nieuwe levels moeten een korte `instruction`, `preview`, `explanation`, `hint` en optioneel `nextStep`/`success` krijgen. De engine controleert de preview en hint met chess.js.
- De levelkiezer is minder zichtbaar; de knop "Volgende les" verschijnt na afronding en leidt de standaardroute.
