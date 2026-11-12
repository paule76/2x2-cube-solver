# 3D-Ansicht mit Pfeilen und Animation – Design

## Ziel
Neben dem Eingabe-Netz zeigt ein drehbarer 3D-Würfel den aktuellen Stand der
Lösung. Der nächste Zug wird per Pfeil angekündigt und bei „Weiter“/„Zurück“
animiert ausgeführt. Dazu: Autoplay, Synchronisierung Netz ↔ 3D, Tastatursteuerung.

**Erfolg:** Man kann eine Lösung am echten Würfel nachdrehen, indem man nur
auf den 3D-Würfel schaut (Pfeil zeigt Seite und Richtung, Animation bestätigt).

## Rahmen
- Weiterhin reines HTML/CSS/JS, keine Abhängigkeiten, kein Build.
- Darstellung mit CSS-3D (`transform-style: preserve-3d`), Pfeile als SVG.
- Modell (`cube.js`) und Solver (`solver.js`) bleiben unverändert.
- UI-Texte auf Deutsch.

## Bausteine

### `src/geometry.js` (rein, ohne DOM)
- Koordinaten: x nach rechts (R), y nach oben (U), z nach vorne (F).
  Steine sitzen auf (±1, ±1, ±1)-Positionen; Sticker-Normale ist eine Achse (±x, ±y, ±z).
- `STICKERS[24]`: für jeden Facelet-Index `{ position:[x,y,z], normal:[x,y,z] }`,
  passend zur Facelet-Reihenfolge des Netzes (U R F D L B, je 4, wie in `cube.js`).
- `layerOf(face)`: die 4 Stein-Positionen der Schicht U (y=+1), R (x=+1), F (z=+1).
- `rotation(move)`: `{ axis:'x'|'y'|'z', degrees }` für die Animation; Uhrzeigersinn
  = mit Blick auf die Seite (also negativer Drehsinn um die Außennormale).
- Muss konsistent mit `cube.js` sein: Dreht man die Sticker der Schicht in 3D um
  `rotation(move)`, ergibt sich exakt `toFacelets(applyMove(...))`.

### `src/views/cube3d-view.js`
Gleiche View-Schnittstelle wie das Netz, erweitert:
- `render(facelets)` – färbt 8 Steine × sichtbare Sticker; setzt Animations-Transforms zurück.
- `showMove(move, direction) -> Promise` – dreht die 4 Steine der Schicht per
  CSS-Transition (~300 ms; bei `prefers-reduced-motion` sofort), resolved nach Ende.
  `direction = -1` animiert die Umkehrung.
- `showHint(move | null)` – gebogener SVG-Pfeil auf der zu drehenden Seite in
  Drehrichtung; bei `X2` mit „2“-Markierung; `null` blendet aus.
- `highlight(index | null)` – hebt einen Sticker hervor.
- Optionen: `onStickerClick(index)`.
- Kamera: Standard `rotateX(-25deg) rotateY(-35deg)` (U, F, R sichtbar).
  Ziehen mit Maus/Finger (Pointer Events) dreht die Ansicht; Button
  „Ansicht zurücksetzen“. Kein Seiten-Scroll beim Ziehen auf dem Würfel (`touch-action: none`).

### Netz-Ansicht (Erweiterung)
- `highlight(index | null)` – hebt ein Feld hervor (Rahmen + kurzes Blinken).
- Optionen: `onCellHover(index | null)` (Maus-Hover und Fokus).

### `src/player.js` (rein, mit injizierbarer Uhr)
- `createPlayer({ step(): Promise<boolean>, setTimeout, clearTimeout })`
  mit `play()`, `pause()`, `toggle()`, `setTempo('langsam'|'normal'|'schnell')`, `playing`.
- Pausen zwischen Zügen: langsam 1500 ms, normal 800 ms, schnell 300 ms (nach Ende der Animation).
- Stoppt, wenn `step()` false liefert (Ende erreicht oder Lösung ungültig).
- App pausiert den Player bei jeder manuellen Navigation, Eingabe, neuem Lösen.

### `src/keys.js` (rein)
- `keyAction(event) -> 'prev'|'next'|'first'|'last'|'toggle'|null`:
  ←/→, Home/End, Leertaste. `null`, wenn Modifier gedrückt oder Fokus in
  `input`/`select`/`textarea`. App reagiert nur, wenn eine Lösung angezeigt wird;
  Leertaste verhindert dann Seiten-Scroll.

### `src/app.js` (Anpassung)
- Verwaltet eine Liste von Views (Netz + 3D); `render`, `showMove`, `showHint`,
  `highlight` gehen an alle, die sie implementieren.
- Hint = nächster Zug der Lösung (oder `null` ohne Lösung / am Ende).
- `showMove` wird für beide Views parallel aufgerufen; der Stepper wartet auf beide.
- Sync: Hover/Fokus im Netz → `highlight` im 3D; Klick im 3D → `highlight` im Netz.
- Solution-Panel: zusätzlich Play/Pause-Button und Tempo-Auswahl.

## Layout
- Desktop (≥ 760 px): Eingabe-Panel mit Netz links, 3D-Würfel rechts.
- Mobil: 3D-Würfel unter dem Netz. Kein horizontales Scrollen bei 360 px.
- 3D-Würfel auch ohne Lösung sichtbar (zeigt die Eingabe live).

## Tests
- `geometry.test.js`: 24 eindeutige (Position, Normale)-Paare; jeder Sticker liegt auf
  seiner Seite (Normale passt zur Netz-Seite); für alle 9 Züge und 200 Zufallsfolgen
  stimmt die 3D-Sticker-Rotation mit `toFacelets(applyMoves(...))` überein.
- `player.test.js`: Fake-Uhr; spielt bis zum Ende und stoppt; pause stoppt;
  Tempo bestimmt Wartezeit; toggle.
- `keys.test.js`: Tastenzuordnung, Modifier, Fokus in Eingabefeld.
- Playwright (manuell im Scratchpad): 3D sichtbar, Pfeil sichtbar für nächsten Zug,
  Animation läuft und Endzustand stimmt mit Netz überein, Autoplay erreicht „Fertig“,
  Tastatur ← → Leertaste, Hover-Sync, keine Konsolenfehler, kein H-Scroll bei 375 px.

## Nicht im Umfang
Einfärben im 3D-Modell, zufälliges Mischen, Licht/Schatten.
