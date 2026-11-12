# Pause bei halben Drehungen + Deutsch/Englisch – Design

## Ziel
1. Halbe Drehungen (`U2`, `R2`, `F2`) sind beim Nachdrehen leichter mitzuzählen:
   zwei Vierteldrehungen mit Pause und eingeblendetem Zähler „1“ / „2“.
2. Die App gibt es auf Deutsch und Englisch, mit Umschalter.

## Rahmen
- Keine Abhängigkeiten, kein Build. `solver.js`, `geometry.js` unverändert.
- Zug-Notation (`R`, `U2`, `F'`) und Seitenbuchstaben (U R F D L B) bleiben in beiden Sprachen gleich.

## Teil 1: Halbe Drehungen
- `cube3d-view.showMove(move, direction)` bei `move.turns === 2`:
  1. Vierteldrehung (300 ms), dabei Zähler „1“ auf der Seite.
  2. Pause 400 ms (Zähler „1“ bleibt sichtbar).
  3. Zweite Vierteldrehung (300 ms) von 90° auf 180°, Zähler „2“.
  4. Zähler ausblenden; Promise resolved.
- Rückwärts (`direction = -1`) identisch mit umgekehrter Drehrichtung.
- Zähler: Element `.turn-count` auf der Ebene der Seite (wie der Pfeil), große Zahl, weiß mit dunklem Schatten.
- `prefers-reduced-motion`: keine Animation, kein Zähler (wie bisher sofort).
- Vierteldrehungen (`X`, `X'`) unverändert.
- Konstanten: `TURN_MS = 300`, `HALF_TURN_PAUSE_MS = 400`.

## Teil 2: Deutsch / Englisch

### Modul `src/i18n.js`
- `MESSAGES = { de: {...}, en: {...} }` – flache Schlüssel, z. B. `'button.solve'`.
- `createI18n({ lang, messages = MESSAGES }) -> { t(key, params?), lang, setLang(lang) }`
  - Platzhalter `{name}` werden aus `params` ersetzt.
  - Fehlender Schlüssel → Schlüssel selbst zurückgeben (sichtbar, nicht abstürzen).
- `detectLang({ stored, navigatorLanguages })`: gespeicherte Wahl (`'de'|'en'`) gewinnt; sonst erste Browsersprache, die mit `de` beginnt → `'de'`; sonst `'en'`.
- Speicherung der Wahl in `localStorage` unter `cube-solver-lang`; jeder Zugriff in try/catch.

### Sprachneutrale Würfellogik
- `parseFacelets` liefert bei Fehlern `{ ok:false, code, params }` statt eines deutschen Textes:
  - `incomplete` · `colorCount {color, count}` · `cornerOrder {position, colors}` ·
    `cornerImpossible {position, colors}` · `duplicateCorner` · `twistedCorner`
  - `position` als Eckname (`'URF'`, `'UFL'`, …), `colors` als Farbbuchstaben-Array.
- `COLOR_NAMES` wandert aus `cube.js` in die Wörterbücher (`color.W` … `color.O`).
- Deutsche Texte bleiben wortgleich zu heute (Tests prüfen das).

### Oberfläche
- Feste Texte in `index.html` bekommen `data-i18n="key"` (Textinhalt) bzw.
  `data-i18n-attr="aria-label:key"`; `applyStaticTexts()` setzt sie.
- `<html lang>`, `<title>` und `meta description` werden mitgesetzt.
- Dynamische Texte (Meldung, Schritt-Text, Zugbeschreibung, Play-Button, Rückfragen,
  Seitennamen für Screenreader, Farbnamen) über `t()`.
- Die Meldungszeile merkt sich `{ key, params, kind }` und wird beim Umschalten neu übersetzt.
- `step-text.js`: `describeMove(m, t)` und `stepText(moves, step, t)`.
- Umschalter: zwei Buttons „DE“ / „EN“ oben rechts im Header (`aria-pressed`),
  Gruppe mit `aria-label` „Sprache“ / „Language“.

### Englische Kernbegriffe
Solve · Random scramble · Reset to solved · Clear · Previous · Next · First · Last ·
Play / Pause · Speed (slow / normal / fast) · Reset view · Top/Right/Front/Bottom/Left/Back ·
clockwise / counter-clockwise / half turn (180°) · “Already solved!” · “Done – the cube is solved! 🎉”.

## Tests
- `i18n.test.js`: `de` und `en` haben exakt dieselben Schlüssel; Platzhalter in beiden gleich;
  `t` ersetzt Platzhalter; unbekannter Schlüssel → Schlüssel; `detectLang`-Fälle
  (gespeichert, `de-AT`, `en-US`, `fr`, leer).
- `parse.test.js`: auf Codes/Params umgestellt; zusätzlich: deutsche Formatierung ergibt
  exakt die bisherigen Meldungen (z. B. „Weiß kommt 3× vor (erwartet: 4×).“).
- `step-text.test.js`: deutsche Texte unverändert; englische Variante.
- Playwright: Umschalten DE↔EN ändert Buttons, Meldung und Schritt-Text; Wahl bleibt nach Reload;
  `R2`-Animation zeigt „1“, Pause, „2“ und dauert ≈ 1 s; reduced motion ohne Zähler;
  kein H-Scroll bei 375 px; keine Konsolenfehler.
