import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { SOLVED, MOVES, applyMove, applyMoves, toFacelets, parseFacelets, isSolved } from '../src/cube.js';
import { encode, decode, createSolver } from '../src/solver.js';
import { randomMoves, randomState } from './helpers.js';

let solver;
before(() => {
  const t = performance.now();
  solver = createSolver();
  console.log(`# createSolver: ${Math.round(performance.now() - t)} ms`);
});

test('encode/decode round trip', () => {
  for (let i = 0; i < 50; i++) {
    const s = randomState(20);
    const idx = encode(s);
    assert.ok(idx >= 0 && idx < 3674160);
    assert.deepEqual(decode(idx), s);
  }
  assert.equal(encode(SOLVED), 0);
});

test('solved has distance 0 and empty solution', () => {
  assert.equal(solver.distance(SOLVED), 0);
  assert.deepEqual(solver.solve(SOLVED), []);
});

test('single move solved in one', () => {
  for (const m of MOVES) {
    const s = applyMove(SOLVED, m);
    const sol = solver.solve(s);
    assert.equal(sol.length, 1);
    assert.ok(isSolved(applyMoves(s, sol)));
  }
});

test('random scrambles', () => {
  for (let i = 0; i < 200; i++) {
    const n = 1 + (i % 20);
    const s = applyMoves(SOLVED, randomMoves(n));
    const sol = solver.solve(s);
    assert.ok(isSolved(applyMoves(s, sol)));
    assert.ok(sol.length <= n);
    assert.ok(sol.length <= 11);
  }
});

test('max distance is 11 and all states reached', () => {
  assert.equal(solver.maxDistance, 11);
  assert.equal(solver.unreached, 0);
});

test('solves from facelets', () => {
  for (let i = 0; i < 20; i++) {
    const r = parseFacelets(toFacelets(randomState(25)));
    assert.ok(r.ok, r.error);
    const f = toFacelets(applyMoves(r.state, solver.solve(r.state)), r.scheme);
    for (let face = 0; face < 6; face++) {
      assert.equal(new Set(f.slice(face * 4, face * 4 + 4)).size, 1);
    }
  }
});
