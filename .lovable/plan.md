# Mluvící animace vln (speaking)

Cíl: při stavu `speaking` se vnější prstenec vln chová jako rozvlněná membrána reagující na hlas – přesně jako v přiloženém videu (ignoruji ostatní animace, jen vlny). Mění se POUZE vlny, zbytek center piece (jádro/sphere, aura, mřížka, barvy) zůstává stejný.

## Co se změní (jen `src/components/Orb/OrbCanvas.tsx`)

Dnes `speaking` jen:
- mírně zvedne rychlost rotace (`tSpeed = 1.3`)
- nafoukne poloměr přes `inflate` podle `speakLevel`

Přidám hlasově reaktivní **vlnitou deformaci** prstence:

1. **Nová deformační funkce vln** – low-frequency „waveform“ kolem kruhu (např. `sin` několika harmonických + existující `deformGlobal` noise), jejíž amplituda roste s `speakLevel` a okamžitým `level` z mikrofonu/TTS. Tím vznikne nepravidelný, špičatý okraj místo hladkého kruhu.

2. **Aplikace na ribbon stack (sekce 8 „the bright waves“)** – do výpočtu `rr` přidám člen `speakLevel * waveform(a) * R`, takže se jednotlivé pásky vln vlní a tvoří hřebeny/údolí. V klidu (`speakLevel ≈ 0`) je výsledek identický s dnešním stavem.

3. **Aplikace na haze prstenec (sekce 9)** – stejná deformace v menší míře, aby „mlha“ kopírovala vlnící se okraj a vznikl dojem tloušťky membrány.

4. **Rychlejší chvění při mluvení** – do amplitudy přidám rychlou složku (`sin(t * ~9–12)`) modulovanou hlasem, takže membrána „dýchá“ v rytmu řeči (jako ve videu), ne jen staticky nafoukne.

5. **Lite verze (rohový orb)** – necháma beze změny (případně velmi jemně), aby to nezatěžovalo a malý orb zůstal čistý.

## Zachování stávajícího chování

- Stavy `standby`, `thinking`, `listening` se nemění.
- Všechny barvy, jádro, počty částic, výkonové optimalizace (cache pozadí, `lite`) zůstávají.
- Při nulovém hlasu vypadá orb stejně jako teď → žádná vizuální regrese v klidu.

## Technická poznámka

`speakLevel` se už plynule interpoluje z `levelRef` (mic/TTS analyser přes `useMicAnalyser`). Využiju ho jako vstup amplitudy, aby vlny reagovaly na skutečnou hlasitost řeči.

Žádné změny v backendu, store ani jinde – čistě prezentační úprava jednoho canvas souboru.
