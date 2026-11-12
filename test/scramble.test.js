import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, SOLVED, applyMoves, toFacelets, parseFacelets, moveToString } from '../src/cube.js';
import { randomScramble } from '../src/scramble.js';

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

test('uses all faces and turn kinds', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) for (const m of randomScramble()) seen.add(moveToString(m));
  assert.equal(seen.size, 9);
});

test('result is a valid cube state', () => {
  const r = parseFacelets(toFacelets(applyMoves(SOLVED, randomScramble())));
  assert.ok(r.ok, r.error);
});
