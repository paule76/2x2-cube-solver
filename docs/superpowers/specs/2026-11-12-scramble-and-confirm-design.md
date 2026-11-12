# Zufällig mischen + Rückfrage vor Überschreiben – Design

## Ziel
1. Ein Button „Zufällig mischen“ erzeugt eine zufällige Mischung und zeigt sie
   animiert im 3D-Würfel; danach steht der gemischte Würfel im Netz und man löst selbst.
2. Aktionen, die die Eingabe überschreiben, fragen vorher nach, damit nichts
   versehentlich verloren geht.

## Rahmen
- Keine Abhängigkeiten, kein Build; `cube.js`, `solver.js`, `geometry.js` unverändert.
- UI-Texte auf Deutsch.

## Mischen
- `src/scramble.js`: `randomScramble(length = 12, rng = Math.random) -> Move[]`
  - Züge aus `MOVES` (U, R, F je `X`, `X2`, `X'`).
  - Nie zwei aufeinanderfolgende Züge auf derselben Seite.
  - `rng` liefert Zahlen in [0, 1) (injizierbar für Tests).
- Button `#scramble` „Zufällig mischen“ in der Aktionsleiste (nach „Lösen“).
- Ablauf in `app.js`:
  1. Player pausieren, Lösung verwerfen.
  2. Eingabe = gelöster Würfel (Standard-Farbschema), rendern.
  3. Für jeden Zug: `showMove(move, 1)` an alle Views (Animation wie beim Lösen,
     ~300 ms; bei `prefers-reduced-motion` sofort), dann Eingabe = neuer Stand, rendern.
  4. Meldung: `Gemischt mit: <Notation> – jetzt „Lösen“ drücken.`
- Während des Mischens („busy“): Lösen, Mischen, Zurücksetzen und Leeren sind
  `disabled`; Klicks ins Netz und Tastenkürzel werden ignoriert. Kamera drehen und
  „Ansicht zurücksetzen“ bleiben erlaubt.

## Rückfrage (zweistufiger Button)
- `src/confirm.js`: `createConfirm({ timeoutMs = 3000, setTimeout, clearTimeout, onArm, onDisarm })`
  → `{ press(): boolean, reset(), get armed }`
  - `press()` im Ruhezustand: scharf schalten (`onArm`), Timer starten, gibt `false`.
  - `press()` scharf: Timer löschen, entschärfen (`onDisarm`), gibt `true` (= ausführen).
  - Timer läuft ab: entschärfen (`onDisarm`).
  - `reset()`: entschärfen ohne Ausführung.
- Scharf geschalteter Button: Text „Wirklich leeren?“ / „Wirklich zurücksetzen?“ /
  „Wirklich mischen?“, rote Darstellung (Klasse `danger`), `aria-live`-Hinweis über
  die vorhandene Meldungszeile.
- Wann wird gefragt:
  - **Leeren:** immer (außer das Netz ist schon leer).
  - **Gelöst zurücksetzen** und **Zufällig mischen:** nur, wenn die Eingabe weder
    leer noch ein gelöster Würfel ist (`parseFacelets(input).ok && isSolved(state)`
    bzw. alle Felder leer → keine Rückfrage).
- Klick auf einen anderen Button oder ins Netz entschärft offene Rückfragen.

## Tests
- `scramble.test.js`: Länge (Standard 12, Parameter); keine gleiche Seite direkt
  hintereinander (1000 Mischungen); deterministisch mit festem `rng`; Ergebnis
  angewandt auf `SOLVED` ist ein gültiger Zustand, den `parseFacelets(toFacelets(...))` akzeptiert.
- `confirm.test.js` (Fake-Uhr): erster `press` → false + armed; zweiter → true;
  Ablauf nach 3000 ms → disarmed, nächster `press` → false; `reset` → disarmed ohne Ausführung.
- Playwright: Mischen animiert (3D-Schicht dreht sich), danach 3D == Netz und Würfel nicht gelöst,
  Meldung enthält 12 Züge; Buttons während des Mischens disabled; Lösen danach liefert ≤ 11 Züge;
  Leeren: 1. Klick ändert nur Button-Text, 2. Klick leert; nach 3,5 s ohne 2. Klick unverändert;
  Zurücksetzen auf gelöstem Würfel ohne Rückfrage; kein H-Scroll bei 375 px; keine Konsolenfehler.
