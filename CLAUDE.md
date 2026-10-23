# CLAUDE.md — termijnpartner.nl

Context voor Claude (en voor mensen) bij werk aan deze repo. Lees dit eerst.

> De GitHub-repo is openbaar. Zet hier **nooit** vertrouwelijke bedrijfsafspraken, tarieven tussen partijen, wachtwoorden of persoonsgegevens in.

## Wat is dit

Marketingsite van **TermijnPartner** (https://termijnpartner.nl): een platform waarmee bedrijven met hoge orderwaardes (bouw, keukens, auto's, tandartsen, zonnepanelen, enz.) klanten in termijnen laten betalen. Statische HTML/CSS/JS, **geen build-stap**, geen backend.

- Eigenaar/gebruiker: Freek (Tada Solutions). Taal van de site en van het overleg: **Nederlands**.
- GitHub: `FRST2002/termijnpartner.nl`, branch `main`.
- Hosting: **Vercel**, gekoppeld aan deze repo. Een push naar `main` zet de site automatisch live.
- Lokale map: `C:\A-Bedrijf\termijnpartner.nl`. De oude map `C:\A-Bedrijf\TermijnPartner` is een oudere losse kopie, geen git-repo; gebruik die niet meer.

## Werkafspraken (belangrijk)

- **Pushen alleen na expliciete opdracht** ("push"). Elke push naar `main` gaat live. Niet pushen "omdat het klaar is".
- Na een wijziging eerst laten zien wat er veranderd is en vragen: "Zal ik pushen?".
- Vercel deployt **traag**: meestal 3–5 minuten, soms langer. Zeg dus niet "over een minuut live". Controleer eventueel `https://api.github.com/repos/FRST2002/termijnpartner.nl/commits/<sha>/status`.
- Eindgebruikers zijn ondernemers/installateurs, **geen rekenwonders**: kort, simpel, weinig tekst. Geen jargon, **geen rentes noemen** op de partnerspagina.
- Noem het bedrijf altijd **"TermijnPartner"**, nooit "wij" of "ons".
- Wijzig niets buiten wat gevraagd is. Als iets onduidelijk is: korte vraag, niet raden.
- Ik (Claude) zie niet wat jij op je scherm ziet. Vraag bij opmaakproblemen om een screenshot (en welk toestel: iPhone/Android/desktop).

## Structuur

| Bestand | Wat |
|---|---|
| `index.html` | Homepage |
| `style.css`, `tailwind-built.css`, `main.js` | Opmaak en gedrag (menu, FAQ, branches-carrousel, scroll-reveal). Tailwind is **vooraf gebouwd**; nieuwe Tailwind-klassen werken dus niet zomaar |
| `branche-*.html` | Pagina per branche (bouw, keukens, badkamers, auto's, zonnepanelen, warmtepompen, tandartsen) |
| `blog*.html`, `over-ons.html`, `privacybeleid.html`, `algemene-voorwaarden.html`, `disclaimer.html` | Overige pagina's |
| `partners.html` | **Rekenmodel voor partners/ondernemers** (zie hieronder) |
| `marketing.html` | Interne presentatie voor een marketingpartner (zie hieronder) |
| `middleware.js`, `lib/markdown-content.mjs` | Levert een Markdown-versie van pagina's aan AI-crawlers (`Accept: text/markdown`) |
| `llms.txt`, `robots.txt`, `sitemap.xml` | Voor zoekmachines en AI-agents |
| `vercel.json` | Routes (zie hieronder) |

### Let op: Markdown-spiegel
`lib/markdown-content.mjs` bevat een **kopie van de paginatekst** voor AI-crawlers. Verander je tekst in een HTML-pagina (bijv. prijzen), pas dan **ook** dat bestand aan, anders spreken de twee elkaar tegen. Controleer na bewerken met `node --check lib/markdown-content.mjs`.

### Routes (`vercel.json`)
`/about` → over-ons, `/privacy` → privacybeleid, `/marketing` → `marketing.html`.
`/partners` is **niet** ingesteld: alleen `/partners.html` werkt. (Toe te voegen als gewenst.)

## Pagina `partners.html` — rekenmodel

Doel: in een gesprek met een ondernemer laten zien wat termijnbetaling kost en wat de klant per maand betaalt. De ondernemer ziet de pagina zelf ook, dus de teksten spreken **"u"** aan en blijven kort. De pagina heeft `noindex` en staat niet in de sitemap (alleen via directe link).

Vaste uitgangspunten (zo bedoeld door Freek, niet "per ongeluk"):
- **Transactievergoeding: vast 10%** per deal, over de factuurwaarde excl. btw.
- **Sale door TermijnPartner:** schakelaar, geeft **+5%** (dus 15% per deal). Vast percentage.
- **Maandelijkse kosten (CRM en Finance): vast €1.000** per maand.
- **1 gefinancierde opdracht per maand** (vaste waarde `DEALS` in het script; de slider is bewust weggehaald).
- **Maandbedrag voor de klant = prijs ÷ 180 maanden**, zonder rente, excl. btw. Rente wordt op deze pagina bewust niet genoemd.
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
- Nog **wel** aanwezig: voorbeeldbedragen (€15.000 / €10.000), pakketprijs (€300 p/m), en "vanaf €…" op de branchepagina's auto's, badkamers, bouw, keukens, warmtepompen, plus teksten op tandartsen/zonnepanelen en in twee blogs. Pas alleen aan als Freek dat vraagt.

## Feiten over het product (uit de site, niet verzinnen)

- Klant kiest zelf maandbedrag en looptijd; **tot 180 maanden**, maximum verschilt per branche. Aanbetaling is optioneel.
- Het bedrijf krijgt **100% van het bedrag vooraf**; de klant betaalt terug aan de financieringspartner.
- Rente verschilt per klant en wordt door de financieringspartner vooraf besproken. TermijnPartner zelf verstrekt het krediet niet.
- Demo boeken en WhatsApp-links staan in de header/CTA's van de pagina's; hergebruik die zoals ze er staan.

## Techniek en valkuilen

- Windows + PowerShell. `git push` meldt in PowerShell een rode "NativeCommandError" terwijl de push gewoon gelukt is; kijk naar de regel `oud..nieuw main -> main`.
- Git geeft "LF will be replaced by CRLF"-waarschuwingen; onschadelijk.
- `vercel.json` gebruikt `outputDirectory: "."`: bestanden in de hoofdmap kunnen publiek geserveerd worden. `README.md`, `package.json` en `vercel.json` geven nu 404, maar `lib/markdown-content.mjs` is wel bereikbaar. Dit bestand (`CLAUDE.md`) staat in `.vercelignore` zodat het niet op de website komt (op GitHub is het wel zichtbaar).
- Commit-berichten eindigen met de `Co-Authored-By`-regel van Claude.
