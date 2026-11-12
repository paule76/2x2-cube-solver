# Pause bei halben Drehungen + DE/EN Implementation Plan

> **For agentic workers:** Execute task-by-task (executing-plans, inline). `bd` is not available here; git history is the record.

**Goal:** Halbe Drehungen als 2 × 90° mit Pause und Zähler; komplette Oberfläche auf Deutsch und Englisch mit Umschalter.

**Architecture:** `cube3d-view` animiert X2 in zwei Phasen. Neues `i18n.js` (Wörterbücher, `t`, `detectLang`); `cube.js` liefert Fehlercodes; `step-text.js` und `app.js` übersetzen über `t`; statisches HTML über `data-i18n`.

**Tech Stack:** ES-Module, `node --test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-12-half-turn-pause-and-i18n-design.md`

## Global Constraints
- Keine Abhängigkeiten, kein Build; `solver.js`, `geometry.js` unverändert.
- `TURN_MS = 300`, `HALF_TURN_PAUSE_MS = 400`; reduced motion: sofort, kein Zähler.
- Deutsche Texte wortgleich zu heute. localStorage-Schlüssel `cube-solver-lang`, Zugriffe in try/catch.
- Fehlercodes: `incomplete`, `colorCount {color,count}`, `cornerOrder {position,colors}`, `cornerImpossible {position,colors}`, `duplicateCorner`, `twistedCorner`.

---

### Task 1: Halbe Drehungen mit Pause und Zähler
**Files:** Modify `src/views/cube3d-view.js`, `style.css`
**Acceptance Criteria:** `R2` dauert ≈ 1000 ms (300 + 400 + 300); während Phase 1/Pause zeigt `.turn-count` „1“, in Phase 2 „2“, danach ausgeblendet; Endstand 3D == Netz; reduced motion < 100 ms ohne Zähler; Vierteldrehungen unverändert.
- [ ] Step 1: Playwright-Check `check-half.cjs` schreiben (Eingabe = Zustand nach `R2`, Lösen → `R2`; „Weiter“; Zähler-Text bei 150 ms = „1“, bei 500 ms = „1“, bei 850 ms = „2“; fertig nach ≤ 1200 ms; 3D == Netz) → FAIL gegen aktuellen Code.
- [ ] Step 2: `showMove` aufteilen: Hilfsfunktion `turnLayer(layer, axis, fromDeg, toDeg, ms)` (Transition + `transitionend`/Timeout-Fallback); für `turns === 2`: `turnLayer(0→±90)`, `wait(400)`, `turnLayer(±90→±180)`; Zähler-Element wie der Pfeil auf der Seitenebene platzieren.
- [ ] Step 3: Check → PASS; `npm test` → PASS; bestehende Browser-Checks grün.
- [ ] Step 4: Commit `feat: half turns animate as two counted quarter turns`

### Task 2: `i18n.js`
**Files:** Create `src/i18n.js`, `test/i18n.test.js`
**Interfaces:** `MESSAGES`, `createI18n({lang, messages}) -> {t, lang, setLang}`, `detectLang({stored, navigatorLanguages}) -> 'de'|'en'`, `LANGS = ['de','en']`
**Acceptance Criteria:** identische Schlüsselmengen in `de`/`en`; gleiche Platzhalter je Schlüssel; `t('x.y',{n:3})` ersetzt `{n}`; unbekannter Schlüssel → Schlüssel; `detectLang`: stored `en` → en; `['de-AT']` → de; `['en-US']` → en; `['fr']` → en; `[]` → en; ungültiger stored-Wert wird ignoriert.
- [ ] Step 1: Tests schreiben → FAIL
- [ ] Step 2: Implementieren (alle Texte aus `index.html`, `app.js`, `step-text.js`, `cube.js`, `net-view.js`, `cube3d-view.js` aufnehmen)
- [ ] Step 3: `npm test` → PASS; Commit `feat: i18n dictionaries for German and English`

### Task 3: Sprachneutrale Fehler + übersetzte Schritt-Texte
**Files:** Modify `src/cube.js`, `src/step-text.js`, `test/parse.test.js`, `test/step-text.test.js`; Create `src/messages.js` (`formatParseError(result, t)`)
**Acceptance Criteria:** `parseFacelets` liefert `{ok:false, code, params}`; `formatParseError` mit `de` ergibt exakt die bisherigen Meldungen (alle 6 Codes getestet); englische Variante getestet; `stepText(moves, step, t)` deutsch unverändert, englisch z. B. „Step 1 of 3: F' – front face counter-clockwise“, Ende „Done – the cube is solved! 🎉“.
- [ ] Step 1: Tests umstellen/erweitern → FAIL
- [ ] Step 2: Implementieren; `COLOR_NAMES` aus `cube.js` entfernen
- [ ] Step 3: `npm test` → PASS; Commit `refactor: language-neutral parse errors and translated step text`

### Task 4: Oberfläche zweisprachig
**Files:** Modify `index.html`, `src/app.js`, `src/views/net-view.js`, `style.css`, `README.md`
**Acceptance Criteria:** DE|EN-Umschalter im Header (`aria-pressed`); alle festen Texte über `data-i18n`; `<html lang>`, Titel, Beschreibung gesetzt; Meldung, Schritt-Text, Play-Button, Rückfragen, Farbnamen, Seitennamen übersetzt; Umschalten übersetzt die aktuelle Meldung neu; Wahl bleibt nach Reload; Start in Browsersprache.
- [ ] Step 1: Implementieren
- [ ] Step 2: `npm test` → PASS
- [ ] Step 3: Playwright: Browser `locale: 'en-US'` → englisch; Umschalten auf DE → „Lösen“; Reload → DE bleibt; Fehlermeldung (Farbe 3×) in beiden Sprachen; Lösung + Schritt-Text englisch; alle bisherigen Checks grün; kein H-Scroll 375 px; keine Konsolenfehler.
- [ ] Step 4: Commit `feat: German/English UI with language switch`; Review durch frischen Reviewer; Fixes; Push Branch + main.
