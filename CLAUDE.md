# CLAUDE.md — termijnpartner.nl

Context voor Claude (en voor mensen) bij werk aan deze repo. Lees dit eerst.

> De GitHub-repo is openbaar. Zet hier **nooit** vertrouwelijke bedrijfsafspraken, tarieven tussen partijen, wachtwoorden of persoonsgegevens in.

## Wat is dit

Marketingsite van **TermijnPartner** (https://termijnpartner.nl): een platform waarmee bedrijven met hoge orderwaardes (bouw, keukens, auto's, tandartsen, zonnepanelen, enz.) klanten in termijnen laten betalen. Statische HTML/CSS/JS, **geen build-stap**. Enige backend: `api/quote.js` voor de dakkapel-offertes (zie "Dakkapel-configurator"); die werkt pas na instellen van Upstash en GoHighLevel.

- Eigenaar/gebruiker: Freek (Tada Solutions). Taal van de site en van het overleg: **Nederlands**.
- GitHub: `FRST2002/termijnpartner.nl`, branch `main`.
- Hosting: **Vercel**, gekoppeld aan deze repo. Een push naar `main` zet de site automatisch live.
- Lokale map: `C:\A-Bedrijf\termijnpartner.nl`. De oude map `C:\A-Bedrijf\TermijnPartner` is een oudere losse kopie, geen git-repo; gebruik die niet meer voor de website. **Uitzondering:** daarin staat de submap `3d-configurator` met de bron van de dakkapel-configurator en de generator voor klantversies (zie "Dakkapel-configurator"); die staat niet in git, dus maak er af en toe een back-up van.

## Werkafspraken (belangrijk)

- **Altijd direct pushen** (op verzoek van Freek): na elke doorgevoerde wijziging meteen committen en pushen naar `main`, zonder eerst "Zal ik pushen?" te vragen. Elke push gaat live, dus controleer de wijziging vóór het pushen goed.
- Laat na het pushen kort zien wat er veranderd is en noem de commit.
- Vercel deployt **traag**: meestal 3–5 minuten, soms langer. Zeg dus niet "over een minuut live". Controleer eventueel `https://api.github.com/repos/FRST2002/termijnpartner.nl/commits/<sha>/status`.
- Eindgebruikers zijn ondernemers/installateurs, **geen rekenwonders**: kort, simpel, weinig tekst. Geen jargon, **geen rentes noemen** op de partnerspagina.
- Noem het bedrijf altijd **"TermijnPartner"**, nooit "wij" of "ons".
- Toon op de partnerspagina **nooit de opbrengst van TermijnPartner** (de ondernemer en diens concurrenten kunnen meekijken). Laat zien wat het de **ondernemer oplevert**: extra omzet, 100% vooraf, maandbedrag voor de klant. De transactievergoeding (10% + btw) blijft zichtbaar als prijs bij de opties. De € 1.000 per maand voor CRM en Finance staat op verzoek van Freek **niet** meer op de pagina; noem die dus in het gesprek.
- Wijzig niets buiten wat gevraagd is. Als iets onduidelijk is: korte vraag, niet raden.
- Ik (Claude) zie niet wat jij op je scherm ziet. Vraag bij opmaakproblemen om een screenshot (en welk toestel: iPhone/Android/desktop).

## Structuur

| Bestand | Wat |
|---|---|
| `index.html` | Homepage |
| `style.css`, `tailwind-built.css`, `main.js` | Opmaak en gedrag (menu, FAQ, branches-carrousel, scroll-reveal). Tailwind is **vooraf gebouwd**; nieuwe Tailwind-klassen werken dus niet zomaar |
| `branche-*.html` | Pagina per branche (bouw, keukens, badkamers, auto's, zonnepanelen, warmtepompen, tandartsen) |
| `blog*.html`, `over-ons.html`, `privacybeleid.html` (31-10-2026, door Claude opgesteld; laten controleren), `algemene-voorwaarden.html` (versie 1.0, 30-10-2026), `disclaimer.html` | Overige pagina's |
| `welkom.html` | Bedankpagina op `/welkom`, waar Stripe naartoe stuurt na een betaling. `noindex`, staat niet in menu of sitemap |
| `retourbeleid.html` | Retour- en terugbetalingsbeleid (concept). `noindex`, **nog niet** in footer, sitemap of Markdown-spiegel; wacht op een "go" van Freek. Wel al gekoppeld in Stripe (zie hieronder) |
| `partners.html` | **Rekenmodel voor partners/ondernemers** (zie hieronder) |
| `marketing.html` | Interne presentatie voor een marketingpartner (zie hieronder) |
| `intern.html` | Interne scenario-/partnercalculator (verdienmodel). Staat op `/intern`, **niet beveiligd**, wel met `noindex`-header. Op uitdrukkelijk verzoek van Freek live gezet; wijzig of verspreid de inhoud niet zonder overleg |
| `middleware.js`, `lib/markdown-content.mjs` | Levert een Markdown-versie van pagina's aan AI-crawlers (`Accept: text/markdown`) |
| `llms.txt`, `robots.txt`, `sitemap.xml` | Voor zoekmachines en AI-agents |
| `dakkapel-config.html`, `offerte.html`, `api/quote.js` | 3D-dakkapel-configurator, offertepagina en offerte-API (zie "Dakkapel-configurator"). Routes `/dakkapel-config` en `/offerte`, beide `noindex` |
| `hollandstotaalbouw-dakkapel.html`, `hollandstotaalbouw-offerte.html`, `hollandstotaalbouw-logo.svg` | Klantversie van de configurator voor Holland's Totaalbouw (**gegenereerd**, niet met de hand bewerken) |
| `vercel.json` | Routes (zie hieronder) |

### Let op: Markdown-spiegel
`lib/markdown-content.mjs` bevat een **kopie van de paginatekst** voor AI-crawlers. Verander je tekst in een HTML-pagina (bijv. prijzen), pas dan **ook** dat bestand aan, anders spreken de twee elkaar tegen. Controleer na bewerken met `node --check lib/markdown-content.mjs`.

### Routes (`vercel.json`)
`/about` → over-ons, `/privacy` → privacybeleid, `/welkom` → `welkom.html` (met `X-Robots-Tag: noindex`), `/marketing` → `marketing.html`, `/partners` → `partners.html`.
`/dakkapel-config`, `/offerte`, `/hollandstotaalbouw-dakkapel` en `/hollandstotaalbouw-offerte` → de gelijknamige `.html` (alle met `noindex`).
`/intern` → `intern.html` (met `X-Robots-Tag: noindex`), `/partners` → `partners.html` (ook `/partners.html` werkt nog). Een redirect van `.html` naar `/partners` is bewust niet ingesteld om een redirect-lus te vermijden; eerst testen als dat gewenst is.

## Wachtwoord op /partners, /marketing en /intern

Deze drie pagina's (en hun `.html`-adressen) zitten achter een wachtwoordscherm. Dat zit in `middleware.js` (server-side, draait vóór de pagina wordt uitgeleverd) en zet na een juist wachtwoord een cookie (`tp_auth`, 24 uur).
- Het wachtwoord staat **niet** in de code, alleen de SHA-256-hash. Het wachtwoord is bij Freek bekend.
- Ander wachtwoord instellen: zet in Vercel (Project → Settings → Environment Variables) `PARTNER_PASSWORD` en deploy opnieuw. De variabele wint van de ingebouwde waarde en maakt de hash in de code onbruikbaar.
- Nieuwe beveiligde pagina: voeg het pad (met en zonder `.html`) toe aan `PROTECTED_PATHS` in `middleware.js`.
- **Beperkingen (eerlijk zijn hierover):** de repo is openbaar, dus de bronbestanden (`partners.html`, `marketing.html`, `intern.html`) en de hash zijn op GitHub te lezen; het wachtwoord is kort en daardoor te raden. Dit houdt toevallige bezoekers tegen, geen vastberaden mensen. Echte afscherming vraagt een privé-repo of een andere hostingvorm.
- Test na elke wijziging aan `middleware.js` met een nagebootste `next()` (zie hoe dit eerder is gedaan) en controleer op de live site dat `/` en de andere pagina's gewoon open blijven.

## Pagina `partners.html` — rekenmodel

Doel: in een gesprek met een ondernemer laten zien wat termijnbetaling kost en wat de klant per maand betaalt. De ondernemer ziet de pagina zelf ook, dus de teksten spreken **"je/jouw"** aan (nooit "u/uw") en blijven kort. De pagina heeft `noindex` en staat niet in de sitemap (alleen via directe link).

Vaste uitgangspunten (zo bedoeld door Freek, niet "per ongeluk"):
- **Transactievergoeding: vast 10%** per deal, over de factuurwaarde excl. btw.
- **Sale door TermijnPartner:** schakelaar, geeft **+5%** (dus 15% per deal). Vast percentage.
- **Maandelijkse kosten (CRM en Finance): vast €1.000** per maand.
- **1 gefinancierde opdracht per maand** (vaste waarde `DEALS` in het script; de slider is bewust weggehaald).
- **Maandbedrag voor de klant = prijs ÷ 180 maanden**, zonder rente, excl. btw. Rente wordt op deze pagina bewust niet genoemd. Alle maandbedragen zijn **vanaf-bedragen** (kleine "vanaf" erboven, plus een toelichting onder de kaarten).
- Enige slider: **gemiddelde factuurwaarde excl. btw**. Daarnaast de keuze hoe het bouwbedrijf met de vergoeding omgaat.

De drie opties (teksten door Freek aangeleverd, kort houden):
- **A — volledig uit eigen marge:** klant betaalt de normale prijs.
- **B — 50/50:** de helft in eigen marge, de helft bovenop de klantprijs.
- **C — volledig bovenop de prijs.**
Een schuif (stappen van 5%) laat ook tussenvormen toe, bijvoorbeeld 30/70. Het maandbedrag per optie wordt live berekend.

Getoond: kaarten "Eindklant" en "Bouwbedrijf" (wie betaalt/ontvangt wat), blok "Wat ziet de eindklant?" (prijs zonder/met termijnen, verschil, maandbedrag), extra omzet, en een tabel per maand.

**Open punt (nog niet beslist):** de vergoeding wordt nu berekend over de **factuurwaarde die de klant betaalt** (incl. doorberekend deel). Bij "alles erbovenop" houdt het bedrijf daardoor iets minder dan de normale prijs over (bij €10.000 en 10%: €100). Alternatief: altijd een percentage van de normale prijs. Freek koos "zoals nu"; de tekst bij optie C ("marge blijft volledig behouden") is dus licht afgerond.

Test-aanpak: de rekenlogica zit in het `<script>` onderaan. Haal het eruit, draai het in Node met een nagebootste `document` en vergelijk met een onafhankelijke berekening (is eerder met 3.000 willekeurige scenario's gedaan). `node --check` op het script vangt syntaxfouten.

Mobiel: let op dat knoppen op iOS standaard blauwe tekst krijgen; `.opt` heeft daarom expliciet een tekstkleur. Vraag-labels staan op smalle schermen boven de waarde.

## Pagina `marketing.html` — interne presentatie

Interactieve presentatie voor een marketingpartner (Dak-marketing). Bevat een eigen rekenmodel met een onderlinge verdeling van opbrengsten tussen partijen. Dit staat **openbaar** op `/marketing` en heeft **geen `noindex`**. Bekende punten:
- Transactievergoeding is vastgezet op 10% (slider verwijderd op verzoek).
- De knop "Download HTML" onderaan verwijst naar een bestand dat niet op de site staat (404).
- Voor het eerst plaatsen is het bestand **ongewijzigd** overgenomen op uitdrukkelijke wens van Freek.
Overweeg een `noindex`-header of de repo/pagina privé te maken als de inhoud niet openbaar hoort te zijn.

## Homepage — wat is bewust veranderd

- Branches-carrousel (`main.js`): **prijzen weggehaald** (orderwaarde en "vanaf €x p/m"); alleen branche, foto en USP's blijven.
- "Vanaf €99 per maand" weggehaald uit de intro bij "Hoe werken termijnbetalingen", de lijst "Betalen in termijnen", de Rolex-casus en de vergelijkingen (vervangen door "Een laag maandbedrag").
- Voorbeeldblokken: "Vanaf €85 per maand" (€15.000) en "Vanaf €55 per maand" (€10.000). Roley-kaart: "+200% groei".
- Overal "gratis" weg; "Gratis & vrijblijvend" is "Exclusief voor ondernemers".
- **Demo-knoppen (04-11-2026, op verzoek van Freek):** er wordt geen demo meer via de website ingepland, want het salesteam belt zelf. Alle knoppen heten nu **"Meld je aan"** en openen het aanvraagformulier `https://api.leadconnectorhq.com/widget/form/bYDlvExK6tucU9AsZyhD` (LeadConnector). De oude agenda (booking-widget `.../widget/booking/9FMYDV2YsBBCcbMCHCcm`) is overal weggehaald; **niet terugzetten**. De knoppen "Ontdek wat jouw lijst oplevert" hebben hun tekst behouden maar openen ook het formulier. Nieuwe knop zonder eigen context? Gebruik **"Meld je aan"** met dezelfde link. Knoppen met een eigen, sterke tekst (zoals "Ontdek wat jouw lijst oplevert") houden die tekst: Freek vindt die goed, alleen de link gaat naar het formulier.
- Bewust **niet** aangepast (alleen knoppen en agenda zijn gewijzigd): lopende teksten met het woord "demo" (blog-CTA's "Plan een vrijblijvende demo…", "Stap 1: Plan een demo" in `blog-hoe-snel-starten.html`, de eyebrow "Demo" en "Persoonlijke demo" in de formuliersectie op de homepage, de privacytekst over "demo plannen"). Bespreek met Freek of die ook moeten worden aangepast. Let op: onderaan de homepage-footer staat een restant "Plan een demo in op de documenten te ontvangen" (`href="#"`); dat is waarschijnlijk een foutje.
- "Let op! Geld lenen kost geld" is op uitdrukkelijk verzoek van Freek van **alle** pagina's gehaald (de ondernemer leent zelf niet). Niet terugzetten.
- "Geld vooraf" bij de 100%-vermeldingen.
- Formulier (LeadConnector-iframe, in de sectie `#contact` van de homepage, voorheen de agenda): **geen `loading="lazy"`** gebruiken (dan laadt de widget soms niet). Het iframe heeft `id="inline-bYDlvExK6tucU9AsZyhD"` en `form_embed.js` zorgt voor de hoogte. Na 8 seconden verschijnt een reservelink (`#form-fallback`) als het formulier niet zichtbaar is. De widget werkt alleen op het echte domein, niet lokaal.
- `style.css`: op desktop krijgen twee witte secties onder elkaar minder tussenruimte (`section.bg-white + section.bg-white`). CSS wordt geladen met `?v=11`; verhoog dat nummer na een CSS-wijziging.
- Nog **wel** aanwezig: voorbeeldbedragen (€15.000 / €10.000), pakketprijs (€300 p/m), en "vanaf €…" op de branchepagina's auto's, badkamers, bouw, keukens, warmtepompen, plus teksten op tandartsen/zonnepanelen en in twee blogs. Pas alleen aan als Freek dat vraagt.

## Juridische pagina's

- `algemene-voorwaarden.html`: tekst van Freek (versie 1.0, 30-10-2026), letterlijk overgenomen. Op 03-11-2026 is op verzoek van Freek **Artikel 32** toegevoegd (aanmelding via de Stripe-betaallink, minimaal 3 maanden vast, daarna opzeggen, anders automatische incasso), met `id="betaallink"` zodat je ernaar kunt linken (`algemene-voorwaarden.html#betaallink`). De bestaande artikelen zijn niet aangeraakt; ook de Markdown-spiegel is bijgewerkt. Het versienummer en de datum bovenaan (1.0, 30-10-2026) zijn bewust **niet** aangepast; bespreek met Freek of dat 1.1 moet worden. Let op: Artikel 17.5 geeft ook ná de 3 maanden nog **1 maand opzegtermijn** (zo staat het ook in het retourbeleid).
- `privacybeleid.html`: door Claude opgesteld (31-10-2026). Er staat nog geen vestigingsadres in; laat het juridisch controleren.
- `retourbeleid.html`: door Claude opgesteld. Streng, maar binnen de wet: alleen voor zakelijke klanten (B2B), dus geen 14 dagen bedenktijd. Geen terugbetaling van abonnement of vergoedingen, behalve bij een fout van TermijnPartner. Bij storneren blijft het bedrag verschuldigd.
- Lange juridische pagina's hebben **geen `reveal`**-klasse op de inhoud: die haalt de zichtbaarheidsdrempel niet en blijft dan onzichtbaar.

## Stripe (betalingen, buiten deze repo)

- Het live account is actief (niet meer in sandbox). Abonnement "CRM & Finance": **€ 1.500 per maand excl. btw** via **SEPA-incasso**. Er zijn geen opstartkosten. De btw (21%) berekent Stripe Tax.
- Transactievergoedingen zet Freek **per deal handmatig** in Stripe; die worden betaald via iDEAL.
- Betaallink: https://buy.stripe.com/cNifZg6SMe7G1fv0jR3sI00. Na betalen gaat de klant naar `/welkom`.
- Op de link worden alleen e-mail en bedrijfsnaam gevraagd: geen btw-nummer en geen telefoon, zodat betalen zo makkelijk mogelijk is. Er is een vinkje voor de algemene voorwaarden.
- Onder de knop staat een korte tekst over de incasso en de opzegging na 3 maanden.
- In de checkout-footer staan links naar Juridisch (AV en privacy) en Retouren (`retourbeleid.html`).
- **Nooit** API-sleutels in de repo of in bestanden zetten. Werk alleen met een tijdelijke beperkte sleutel (`rk_live`) en laat Freek die daarna verwijderen.
- Open punten:
  - `partners.html` en de tekst hierboven noemen nog € 1.000 per maand.
  - De AV noemen 7 dagen betaaltermijn, Stripe-facturen 14.
  - Het telefoonnummer in Stripe wijkt af van dat op de site.

## Feiten over het product (uit de site, niet verzinnen)

- Klant kiest zelf maandbedrag en looptijd; **tot 180 maanden**, maximum verschilt per branche. Aanbetaling is optioneel.
- Het bedrijf krijgt **100% van het bedrag vooraf**; de klant betaalt terug aan de financieringspartner.
- Rente verschilt per klant en wordt door de financieringspartner vooraf besproken. TermijnPartner zelf verstrekt het krediet niet.
- De knop "Meld je aan" (aanvraagformulier) en de WhatsApp-links staan in de header/CTA's van de pagina's; hergebruik die zoals ze er staan.

## Dakkapel-configurator (3D) en offertes

Gebouwd (nov 2026) naar het voorbeeld van de configurator van Blurmedia. Klanten stellen een dakkapel samen, zien direct een maandbedrag en vragen een offerte aan. **Nog niet gekoppeld aan GoHighLevel**; er worden nu geen aanvragen opgeslagen of verstuurd.

### Bestanden, werkwijze en generator
- **Bron van de configurator staat buiten de repo:** `C:\A-Bedrijf\TermijnPartner\3d-configurator\index.html` (lokaal, geen git). Werkwijze na elke wijziging: bron aanpassen, kopiëren naar `dakkapel-config.html` in de repo, `python maak-klantconfig.py hollandstotaalbouw` draaien (zelfde map), committen en pushen. Klantversies nooit met de hand bewerken: die worden telkens opnieuw gegenereerd.
- `maak-klantconfig.py` (zelfde lokale map) leest `dakkapel-config.html` en `offerte.html` uit de repo (alleen lezen) en maakt een klantversie met eigen logo, kleuren, lettertype en routes (`/<slug>-dakkapel`, `/<slug>-offerte`). Nieuwe klant = één blok toevoegen aan `KLANTEN` (naam, slug, logo in `klanten\`, kleuren, lettertype, offertenummer-voorvoegsel). `offerte.html` bewerk je wél direct in de repo (dat is de sjabloon).
- Holland's Totaalbouw: oranje `#ff6501`, lettertype Poppins, logo van hun site. Dit is een voorbeeld van "kant-en-klare config"; de **koppeling per klant** (eigen GoHighLevel, eigen prijzen, opslag) zit er nog niet in.
- `INSTELLEN-OFFERTES.md` (lokale configurator-map) beschrijft het instellen van opslag en GoHighLevel.
- Techniek: een enkel HTML-bestand, three.js 0.170 via importmap (cdn.jsdelivr.net), echte HDRI-lucht van Poly Haven (valt terug op een eenvoudige lucht), dakpannen als 3D-instances, procedurele texturen. Instellingen en prijzen staan bovenaan in het object `CONFIG`.

### Opbouw en afspraken met Freek (zo bedoeld, niet "per ongeluk")
- **10 stappen** in het paneel (geen popup meer), met balkjes bovenin: je kunt via de balkjes **alleen terug**, nooit vooruit. 1 Plaatsing, breedte, aantal ramen. 2 Hoogte en raamtype. 3 Bekleding en afval opruimen. 4 Kleuren. 5 Extra's (optioneel). 6 Plaatsing gewenst. 7 Achteraf in termijnen betalen. 8 Manier van inkomen (alleen bij termijn of "beide"; bij "1x betalen" overgeslagen). 9 Jouw gegevens (met klein overzicht met foto; **geen groot beeld**). 10 Adres en woning (foto's, opmerkingen, vinkje algemene voorwaarden).
- **Geen standaardkeuze** bij stappen 6, 7 en 8 (ook niet na verversen). Stappen 6 en 7 gaan automatisch door na een keuze. Ingevulde gegevens van stap 9 en 10 blijven staan (sessionStorage).
- Plaatsing: **achterkant staat links en is standaard** (Freek wil zo min mogelijk voorkantplaatsingen). Bij "Beide zijden" eerst de achterkant, daarna de voorkant. Voor- en achterkant hebben een eigen configuratie. De zon staat aan de achterkant (daar ziet het beeld er het mooist uit).
- **Voorkant: altijd vergunning nodig**, regels verschillen per gemeente. Achterkant: 1500 mm is "Meest gekozen" en vergunningsvrij (staat standaard aan, bewust opvallend: klanten moeten 1500 kiezen); 1750 mm is "deels vergunningsvrij" met toelichting.
- Ramen: **1 raam per 1,2 m breedte**, maximaal 7. Breedte 1,5 tot 9 m, ook typbaar. Woning is standaard 7 m breed en wordt breder bij een grotere dakkapel; altijd 0,5 m vrij per kant. Rijtjeshuis met rode buurdaken. Standaard breedte 2,4 m.
- Kleuren met RAL-code (de RAL-keuzes zijn door Claude gekozen, laat ze controleren). Antraciet is bewust lichter dan echt RAL 7016 zodat het van zwart te onderscheiden is. Zwart staat ook bij kozijnen.
- **Prijsweergave:** in de configurator alleen het maandbedrag ("Vanaf € x p/m", prijs ÷ 180). Bij "1x betalen" toont het overzicht en de offerte het totaal; bij termijn of "beide" het maandtarief met het totaal klein eronder (alleen op de offerte). **Prijzen in `CONFIG` zijn aannames van Claude (richtprijzen, incl. btw), geen echte tarieven.**
- Afval opruimen: keuze in stap 3, standaard "Door het bouwbedrijf"; heeft geen invloed op de prijs.
- Mobiel: eigen layout (beeld sticky bovenin en krimpt geleidelijk tijdens scrollen, prijs- en knoppenbalk vast onderin, witte achtergrond, na de laatste vraag einde pagina). **Zoomen is uitgezet** (viewport, `touch-action` en gebaar-blokkade voor iOS); de offertepagina mag wel zoomen. Laadscherm is bewust licht en rustig (voor grote groepen bezoekers via Meta); de 3D-draadmodel-versie staat in commit `3959687`.
- Wisselen tussen voor- en achterkant gaat direct (geen camerarondvlucht). De camerknoppen heten Recht, Schuin en Zijkant en volgen de gekozen kant.

### Offertes (code klaar, nog niet ingeschakeld)
- **Nu staat `previewOnly: true` in `CONFIG`:** na "Verstuur aanvraag" verschijnt direct een voorbeeldofferte (`offerte.html?preview=1`, uit localStorage, met PDF-download via printen). Er wordt niets opgeslagen of verstuurd. Zet op `false` zodra opslag en koppeling klaar zijn.
- Echte werking (`api/quote.js`): offertes in **Upstash Redis**, per offerte een niet te raden link `/offerte?id=…` waar de klant kan goedkeuren of afkeuren. TermijnPartner past een offerte aan in dezelfde configurator via `/dakkapel-config?edit=ID` (of `?admin=1` voor een nieuwe), met korting/opmerking, en geeft hem vrij; opnieuw vrijgeven maakt een nieuwe versie. Statussen: aanvraag, concept, verstuurd, goedgekeurd, afgekeurd. De offerte bevat 3D-beelden, specificaties, maattekening en prijsopbouw.
- **GoHighLevel-koppeling:** bij elke stap een contact (upsert) met adres, tag per status (`offerte-aangevraagd`, `-verstuurd`, `-goedgekeurd`, `-afgekeurd`) en een notitie met prijs, dakkapelgegevens, klantlink en interne bewerklink. Er komt nog **geen opportunity/pipeline**. Welke GoHighLevel-omgeving (echt of test) is nog niet gekozen.
- Vercel-variabelen die nodig zijn (alleen namen, **nooit waarden in de repo**): `KV_REST_API_URL` en `KV_REST_API_TOKEN` (komen van Upstash), `ADMIN_PASSWORD`, `GHL_TOKEN`, `GHL_LOCATION_ID`; optioneel `GHL_PRICE_FIELD_ID` en `SITE_URL`. Zonder deze variabelen geeft de API een fout en kan de configurator (met `previewOnly: false`) niets versturen.
- Persoonsgegevens (geboortedatum, adres, inkomen) horen alleen in Upstash en GoHighLevel, **nooit in de repo**.
- Let op: de links in de GoHighLevel-notitie wijzen nu naar `/offerte` en `/dakkapel-config`; voor klantversies moet dat per klant gaan als de koppeling wordt gebouwd.

### Open punten
- GoHighLevel en opslag instellen en een testaanvraag doorlopen (later oppakken).
- Teksten laten controleren: vergunningstekst, "geldig 30 dagen", prijzen incl. btw, afstand tot dakrand in de maattekening (komt uit het 3D-model, niet uit bouwregels).
- Prestaties op oude telefoons zijn niet getest (duizenden dakpan-instances); aantal pannen kan omlaag.
- Bij offertes met beide zijden staan de bedragen per onderdeel ook bij termijnen op de offerte; weglaten kan op verzoek.

## DNS en hosting (TransIP + Vercel)

- Domein bij **TransIP**, nameservers `ns0.transip.net`, `ns1.transip.nl`, `ns2.transip.eu`. De site draait op Vercel (apex stuurt door naar `www`).
- Webrecords in TransIP: `@` **A** `76.76.21.21` en `www` **CNAME** `cname.vercel-dns.com.`. Geen AAAA-regels en geen `*`-regels naar TransIP.
- Mailrecords (MX `mx.transip.email`, SPF, `autoconfig`, `autodiscover`, drie `transip-…_domainkey`, `x-transip-mail-auth`, `_dmarc`) moeten blijven staan.
- **Zet "TransIP-instellingen" in het DNS-scherm nooit aan:** dat vervangt de records door de TransIP-standaard en dan verschijnt de oude website (is op 13-11-2026 per ongeluk gebeurd en hersteld).

## Techniek en valkuilen

- Windows + PowerShell. `git push` meldt in PowerShell een rode "NativeCommandError" terwijl de push gewoon gelukt is; kijk naar de regel `oud..nieuw main -> main`.
- Git geeft "LF will be replaced by CRLF"-waarschuwingen; onschadelijk.
- `vercel.json` gebruikt `outputDirectory: "."`: bestanden in de hoofdmap kunnen publiek geserveerd worden. `README.md`, `package.json` en `vercel.json` geven nu 404, maar `lib/markdown-content.mjs` is wel bereikbaar. Dit bestand (`CLAUDE.md`) staat in `.vercelignore` zodat het niet op de website komt (op GitHub is het wel zichtbaar).
- Commit-berichten eindigen met de `Co-Authored-By`-regel van Claude.
