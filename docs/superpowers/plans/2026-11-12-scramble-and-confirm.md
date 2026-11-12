# Zufällig mischen + Rückfrage Implementation Plan

> **For agentic workers:** Execute task-by-task (executing-plans). `bd` is not available in this environment; progress is tracked in the SDD ledger and git.

**Goal:** Button „Zufällig mischen“ (animierte 12-Zug-Mischung, danach selbst lösen) und zweistufige Rückfrage vor Aktionen, die die Eingabe überschreiben.

**Architecture:** Zwei reine, getestete Module (`scramble.js`, `confirm.js`); `app.js` verdrahtet sie mit den bestehenden Views (`showMove`/`render`), Player und Stepper.

**Tech Stack:** ES-Module, `node --test`, Playwright für Browser-Checks.

**Spec:** `docs/superpowers/specs/2026-11-12-scramble-and-confirm-design.md`

## Global Constraints
- Keine Abhängigkeiten; `cube.js`, `solver.js`, `geometry.js` unverändert.
- UI-Texte auf Deutsch, exakt: „Zufällig mischen“, „Wirklich leeren?“, „Wirklich zurücksetzen?“, „Wirklich mischen?“, Meldung `Gemischt mit: <Notation> – jetzt „Lösen“ drücken.`
- Mischlänge 12; nie zweimal dieselbe Seite hintereinander; Rückfrage-Timeout 3000 ms.

---

### Task 1: `randomScramble`

**Files:** Create `src/scramble.js`, `test/scramble.test.js`

**Interfaces:**
- Consumes: `MOVES`, `SOLVED`, `applyMoves`, `toFacelets`, `parseFacelets`, `moveToString` (cube.js)
- Produces: `randomScramble(length = 12, rng = Math.random) -> Move[]` (Elemente aus `MOVES`)

**Acceptance Criteria:** Länge stimmt; keine gleiche Seite direkt hintereinander; deterministisch bei gleichem `rng`; Ergebnis ist gültiger, lösbarer Zustand.

- [ ] **Step 1: Failing tests**
```js
test('default length 12 and custom length', () => {
  assert.equal(randomScramble().length, 12);
  assert.equal(randomScramble(5).length, 5);
});
test('never the same face twice in a row', () => {
  for (let i = 0; i < 1000; i++) {
    const s = randomScramble();
    for (let k = 1; k < s.length; k++) assert.notEqual(s[k].face, s[k - 1].face);
    for (const m of s) assert.ok(MOVES.includes(m));
  }
});
test('deterministic with a seeded rng', () => {
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const a = randomScramble(12, seeded(42)).map(moveToString).join(' ');
  const b = randomScramble(12, seeded(42)).map(moveToString).join(' ');
  assert.equal(a, b);
});
test('result is a valid cube state', () => {
  const r = parseFacelets(toFacelets(applyMoves(SOLVED, randomScramble())));
  assert.ok(r.ok, r.error);
});
```
- [ ] **Step 2:** `npm test` → FAIL (Modul fehlt)
- [ ] **Step 3:** Implementieren: Seite aus den 2 bzw. 3 erlaubten wählen (`Math.floor(rng() * n)`), dann Drehung aus `[1, 2, -1]`; Rückgabe der passenden Objekte aus `MOVES`.
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** Commit `feat: random scramble generator`

### Task 2: `createConfirm`

**Files:** Create `src/confirm.js`, `test/confirm.test.js`

**Interfaces:**
- Produces: `createConfirm({ timeoutMs = 3000, setTimeout, clearTimeout, onArm = () => {}, onDisarm = () => {} }) -> { press(): boolean, reset(): void, get armed(): boolean }`

**Acceptance Criteria:** 1. `press` schaltet scharf (false); 2. `press` → true und entschärft; Ablauf nach `timeoutMs` entschärft; `reset` entschärft ohne Ausführung; `onArm`/`onDisarm` je einmal pro Übergang.

- [ ] **Step 1: Failing tests** (Fake-Uhr wie in `test/player.test.js`)
```js
test('first press arms, second confirms', () => {
  const c = createConfirm({ setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout, onArm, onDisarm });
  assert.equal(c.press(), false); assert.equal(c.armed, true); assert.deepEqual(clock.delays, [3000]);
  assert.equal(c.press(), true); assert.equal(c.armed, false); assert.equal(clock.pending(), 0);
  assert.deepEqual(events, ['arm', 'disarm']);
});
test('timeout disarms', () => { c.press(); clock.fireAll(); assert.equal(c.armed, false); assert.equal(c.press(), false); });
test('reset disarms without confirming', () => { c.press(); c.reset(); assert.equal(c.armed, false); assert.equal(clock.pending(), 0); });
test('reset when idle does nothing', () => { c.reset(); assert.deepEqual(events, []); });
```
- [ ] **Step 2:** `npm test` → FAIL
- [ ] **Step 3:** Implementieren
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** Commit `feat: two-step confirm helper`

### Task 3: UI-Verdrahtung

**Files:** Modify `index.html`, `src/app.js`, `style.css`, `README.md`

**Interfaces:**
- Consumes: `randomScramble`, `createConfirm`, `isSolved`, `parseFacelets`, `toFacelets`, `applyMove`, `moveToString`; bestehend: `view.showMove`, `render`, `player`, `clearSolution`, `setMessage`.

**Verhalten:**
- Button `<button type="button" id="scramble">Zufällig mischen</button>` direkt nach `#solve`.
- `needsConfirm(kind)`: `clear` → true, außer alle Felder leer; `reset`/`scramble` → false, wenn alle Felder leer oder `parseFacelets(input)` ok und `isSolved(state)`; sonst true.
- Je Button ein `createConfirm`; `onArm`: Button-Text auf „Wirklich …?“, Klasse `danger`, `setMessage('Zum Bestätigen noch einmal klicken.')`; `onDisarm`: Originaltext, Klasse weg. Klick auf einen der drei Buttons → andere Confirms `reset()`; Netz-Klick → alle `reset()`.
- `scrambling`-Flag: während des Mischens sind `#solve`, `#scramble`, `#reset`, `#clear` disabled; `onCellClick` und Tasten-Handler kehren sofort zurück.
- Mischen: `player.pause()`, `clearSolution()`, `input = toFacelets(SOLVED)`, `render()`; für jeden Zug `await view.showMove(m, 1)`, dann `input = toFacelets(applyMove(state, m))`, `render()`; am Ende Meldung (exakter Text siehe Global Constraints), Flag zurück, Buttons wieder aktiv (Lösen nur, wenn Solver bereit).
- CSS: `button.danger:not(.cell):not(.swatch)` rot (`--error`-Farbe als Hintergrund, weißer Text).
- README: Bedienung um Mischen und Rückfrage ergänzen.

- [ ] **Step 1:** Implementieren
- [ ] **Step 2:** `npm test` → PASS (unverändert)
- [ ] **Step 3: Playwright-Check:** Mischen → nach 150 ms ist `#solve` disabled und eine Schicht hat eine Rotation ≠ 0; nach Ende: Meldung enthält 12 Züge, 3D-Farben == Netz-Farben, Netz nicht gelöst; Lösen → ≤ 11 Züge; Mischen erneut → Button zeigt „Wirklich mischen?“; Leeren: 1. Klick nur Text, 2. Klick leert (alle `data-color=""`); Zurücksetzen auf leerem Netz ohne Rückfrage; Leeren-Klick, 3,5 s warten → Text wieder „Leeren“ und Netz unverändert; reduced motion: Mischen fertig < 500 ms; kein H-Scroll bei 375 px; keine Konsolenfehler.
- [ ] **Step 4:** Commit `feat: scramble button and overwrite confirmation`; Push Branch + main
