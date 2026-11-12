# 2x2 Cube Solver – Design

## Ziel
Eine statische Web-App (GitHub Pages), in die man die Farben eines echten,
verdrehten 2x2-Würfels über ein aufgeklapptes Netz eingibt und eine **optimale**
(kürzestmögliche) Zugfolge erhält, die man Schritt für Schritt durchgehen kann.

**Erfolg:** Eingabe eines realen Würfels → Lösung mit ≤ 11 Zügen (HTM),
nach deren Ausführung der Würfel gelöst ist.

## Rahmen
- Reines HTML/CSS/JavaScript (ES-Module), kein Build-Schritt, keine Laufzeit-Abhängigkeiten.
- Läuft vollständig im Browser.
- Repo `paule76/2x2-cube-solver`, Bereitstellung über GitHub Pages via GitHub Actions.

## Würfelmodell
- 8 Ecken; Zustand = Permutation `cp[8]` + Orientierung `co[8]` (0..2).
- Ecke DBL (hinten-unten-links) bleibt fest; Züge nur U, R, F (je `X`, `X'`, `X2` → 9 Züge).
- Zustandsraum: 7! · 3⁶ = 3.674.160.
- Kodierung: Permutationsindex (0..5039) × Orientierungsindex (0..728) → Index in `Uint8Array`.

## Solver (Ansatz 1: vollständige Distanztabelle)
- Einmalige Breitensuche ab dem gelösten Zustand über Move-Tabellen
  (Permutation 5040×9, Orientierung 729×9) → Distanz für jeden Zustand (~3,7 MB, ~1 s).
- Lösung: vom Startzustand jeweils einen Zug wählen, der die Distanz um 1 senkt.
- Ergebnis ist garantiert optimal.

## Eingabe (aufgeklapptes Netz)
- 6 Seiten à 2×2 als Kreuz (U oben; L F R B in der Mitte; D unten).
- Farbpalette (6 Farben), Klick färbt Feld. Buttons „Gelöst zurücksetzen“, „Leeren“.
- Umrechnung Netz → Zustand: Die Farben der DBL-Ecke definieren D/B/L; die
  Gegenfarben ergeben U/F/R. Jede Ecke wird über ihre drei Farben identifiziert,
  die Orientierung über die Position der U/D-Farbe.

## Validierung (mit verständlichen Meldungen)
1. Alle 24 Felder gefärbt.
2. Jede Farbe genau 4×.
3. Jede Ecke ist eine existierende Farbkombination (keine Gegenfarben gemeinsam, korrekte Chiralität).
4. Jede Ecke kommt genau einmal vor.
5. Summe der Orientierungen ≡ 0 (mod 3) – sonst „eine Ecke ist verdreht“.
(Permutationsparität ist beim 2x2 keine Einschränkung.)

## Lösungsanzeige
- Zugfolge in Notation, aktueller Zug hervorgehoben, kurze Erklärung je Zug
  (z. B. „R' – rechte Seite gegen den Uhrzeigersinn“).
- Weiter/Zurück (und Anfang/Ende); das Netz zeigt den jeweiligen Zwischenzustand.
- Bereits gelöster Würfel → Hinweis „Schon gelöst“.
- Während der Tabellen-Berechnung: Status „Initialisiere…“, Lösen-Button deaktiviert.

## Vorbereitung für ein späteres 3D-Modell
Das 3D-Modell wird **jetzt nicht gebaut**, aber die Struktur lässt es ohne Umbau zu:
- **Ansichten als austauschbare Renderer:** `app.js` spricht nur mit einer
  View-Schnittstelle `{ render(facelets), showMove(move, direction) }`.
  Jetzt gibt es `src/views/net-view.js`; später kommt `src/views/cube3d-view.js`
  daneben (z. B. per CSS-3D), ohne Änderungen an Modell oder Solver.
- **Facelet-Darstellung als gemeinsame Sprache:** `cube.js` liefert für jeden
  Zustand ein Array von 24 Farben in fester Reihenfolge (U, R, F, D, L, B; je 4).
  Netz- und 3D-Ansicht rendern beide aus diesem Array.
- **Züge als Daten:** Ein Zug ist ein Objekt `{ face, turns }` (z. B. `{face:'R', turns:-1}`),
  damit eine Animation Drehachse und Richtung direkt ablesen kann.
- **`showMove` darf asynchron sein** (Promise), damit eine Animation die
  Schritt-Navigation sperren kann, bis sie fertig ist. Die Netz-Ansicht löst sofort auf.

## Dateien
- `index.html`, `style.css`
- `src/cube.js` – Modell, Züge, Netz ↔ Zustand, Validierung
- `src/solver.js` – Tabellen, Lösungssuche (ohne DOM)
- `src/app.js` – UI-Steuerung (Palette, Validierung, Schritt-Navigation)
- `src/views/net-view.js` – Netz-Ansicht (Eingabe + Anzeige)
- `test/*.test.js` – `node --test`
- `.github/workflows/pages.yml` – Deployment auf GitHub Pages (Push auf `main`)
- `package.json` (nur `"type": "module"` und `test`-Script), `README.md`

## Tests
- Jeder Zug 4× = Identität; `X X'` = Identität.
- Netz → Zustand → Netz ist verlustfrei.
- Zufällige Mischungen: Lösung angewandt ergibt gelösten Würfel; Länge ≤ Mischlänge und ≤ 11.
- Bekannte Fälle (z. B. ein einzelner Zug → Lösung der Länge 1).
- Ungültige Eingaben (Farbe 5×, verdrehte Ecke, unmögliche Ecke) werden erkannt.

## Bereitstellung
- Entwicklung auf `claude/epic-planck-wjg13e`, Veröffentlichung nach Merge in `main` (PR).
- Einmalig im Repo: Settings → Pages → Source: „GitHub Actions“.

## Nicht im Umfang
3D-Animation (nur vorbereitet, s. o.), Kamera-Scan, Scramble-Eingabe per Notation.
