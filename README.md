# 2x2 Würfel-Löser

Statische Web-App, die einen 2x2-Zauberwürfel **optimal** löst (kürzestmögliche Zugfolge, höchstens 11 Züge).

## Bedienung

1. Farbe in der Palette wählen und die Felder im aufgeklappten Netz einfärben – so, wie dein Würfel aussieht (U = oben, F = vorne, R = rechts, L = links, B = hinten, D = unten).
2. **Lösen** drücken.
3. Mit **Weiter / Zurück** die Züge Schritt für Schritt durchgehen. Das Netz zeigt jeweils den Zwischenstand.

### 3D-Ansicht

- Neben dem Netz zeigt ein 3D-Würfel den aktuellen Stand. **Ziehen** (Maus/Finger) dreht die Ansicht, „Ansicht zurücksetzen“ stellt sie wieder her.
- Ein **Pfeil** zeigt Seite und Richtung des nächsten Zugs; bei „Weiter“/„Zurück“ dreht sich die Schicht animiert (bei „Bewegung reduzieren“ ohne Animation).
- **Abspielen** spielt die Lösung automatisch ab (Tempo langsam / normal / schnell).
- Fährt man im Netz über ein Feld, leuchtet derselbe Sticker im 3D-Würfel auf; ein Klick auf einen 3D-Sticker markiert das Feld im Netz.
- **Tastatur:** ← / → Zurück / Weiter, Pos1 / Ende, Leertaste = Abspielen / Pause.

Notation: `R` = rechte Seite im Uhrzeigersinn (mit Blick auf die Seite), `R'` = gegen den Uhrzeigersinn, `R2` = halbe Drehung. Es werden nur die Seiten U, R und F gedreht – die Ecke hinten-unten-links bleibt an ihrem Platz.

## Wie es funktioniert

Mit fester DBL-Ecke hat der 2x2 genau 7! · 3⁶ = 3.674.160 Zustände. Beim Laden berechnet eine Breitensuche für jeden Zustand die Distanz zum gelösten Würfel (~3,7 MB, unter einer Sekunde). Eine Lösung folgt dann einfach Zügen, die die Distanz jeweils um 1 senken – damit ist sie garantiert optimal.

| Datei | Aufgabe |
|---|---|
| `src/cube.js` | Würfelmodell, Züge, Netz ↔ Zustand, Validierung |
| `src/solver.js` | Distanztabelle und Lösungssuche |
| `src/views/net-view.js` | Netz-Ansicht |
| `src/views/cube3d-view.js` | 3D-Ansicht (CSS-3D), Animation, Pfeile |
| `src/geometry.js` | 3D-Lage der Sticker, Schicht-Drehungen |
| `src/player.js`, `src/keys.js`, `src/stepper.js` | Autoplay, Tastatur, Schritt-Navigation |
| `src/app.js` | Bedienung, Schritt-Navigation |

Ansichten implementieren die Schnittstelle `{ render(facelets), showMove(move, direction), showHint?(move), highlight?(index) }`; die App verteilt Aufrufe an Netz und 3D-Ansicht.

Unterstützt wird das Standard-Farbschema (Weiß↔Gelb, Grün↔Blau, Rot↔Orange gegenüber).

## Lokal starten

Kein Build nötig, aber ES-Module brauchen einen Webserver:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Tests

```bash
npm test   # Node ≥ 20 (CI: Node 24), keine Abhängigkeiten
```

## Veröffentlichung (GitHub Pages)

Der Workflow `.github/workflows/pages.yml` testet und veröffentlicht bei jedem Push auf `main`.

Einmalig im Repository einstellen: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
