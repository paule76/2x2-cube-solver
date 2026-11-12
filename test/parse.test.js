import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOLVED, toFacelets, parseFacelets, isSolved } from '../src/cube.js';
import { randomState } from './helpers.js';

const solved = () => toFacelets(SOLVED);

test('round trip', () => {
  for (let i = 0; i < 20; i++) {
    const s = randomState(15);
    const f = toFacelets(s);
    const r = parseFacelets(f);
    assert.ok(r.ok, r.error);
    assert.deepEqual(r.state, s);
    assert.deepEqual(toFacelets(r.state, r.scheme), f);
  }
});

test('solved in other orientation', () => {
  const f = toFacelets(SOLVED, { U: 'Y', D: 'W', F: 'B', B: 'G', R: 'R', L: 'O' });
  const r = parseFacelets(f);
  assert.ok(r.ok, r.error);
  assert.ok(isSolved(r.state));
});

test('empty field', () => {
  const f = solved();
  f[5] = null;
  assert.deepEqual(parseFacelets(f), { ok: false, error: 'Es sind noch nicht alle Felder gefärbt.' });
});

test('color count', () => {
  const f = solved();
  f[0] = 'Y';
  assert.deepEqual(parseFacelets(f), { ok: false, error: 'Weiß kommt 3× vor (erwartet: 4×).' });
});

test('mirrored corner', () => {
  const f = solved();
  [f[4], f[9]] = [f[9], f[4]];
  const r = parseFacelets(f);
  assert.equal(r.ok, false);
  assert.match(r.error, /^Die Ecke mit /);
});

test('twisted corner', () => {
  const f = solved();
  [f[3], f[4], f[9]] = [f[9], f[3], f[4]];
  assert.deepEqual(parseFacelets(f), { ok: false, error: 'Eine Ecke ist verdreht – so ist der Würfel nicht lösbar.' });
});

test('duplicate corner', () => {
  // URF twice (positions 0,1) and DBL twice (positions 6,7): colour counts stay at 4 each
  const f = toFacelets({ cp: [0, 0, 2, 3, 4, 5, 6, 6], co: [0, 0, 0, 0, 0, 0, 0, 0] });
  assert.deepEqual(parseFacelets(f), { ok: false, error: 'Eine Ecke kommt doppelt vor – bitte Eingabe prüfen.' });
});
