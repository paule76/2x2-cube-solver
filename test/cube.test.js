import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOLVED, MOVES, applyMove, applyMoves, toFacelets, parseMoves, moveToString, isSolved } from '../src/cube.js';

const base = (face) => ({ face, turns: 1 });
const inv = (face) => ({ face, turns: -1 });

test('each base move four times is identity', () => {
  for (const f of ['U', 'R', 'F']) {
    const m = base(f);
    assert.deepEqual(applyMoves(SOLVED, [m, m, m, m]), SOLVED);
  }
});

test("X then X' is identity", () => {
  for (const f of ['U', 'R', 'F']) {
    assert.deepEqual(applyMoves(SOLVED, [base(f), inv(f)]), SOLVED);
    assert.deepEqual(applyMoves(SOLVED, [{ face: f, turns: 2 }, { face: f, turns: 2 }]), SOLVED);
  }
});

test('MOVES has the 9 moves in order', () => {
  assert.equal(MOVES.map(moveToString).join(' '), "U U2 U' R R2 R' F F2 F'");
});

test('solved facelets', () => {
  assert.equal(toFacelets(SOLVED).join(''), 'WWWWRRRRGGGGYYYYOOOOBBBB');
  assert.ok(isSolved(SOLVED));
});

test('R moves front colors to U', () => {
  const f = toFacelets(applyMove(SOLVED, base('R')));
  for (const i of [1, 3]) assert.equal(f[i], 'G');
  for (const i of [9, 11]) assert.equal(f[i], 'Y');
  for (const i of [0, 2]) assert.equal(f[i], 'W');
  for (const i of [13, 15]) assert.equal(f[i], 'B');
  for (const i of [20, 22]) assert.equal(f[i], 'W');
});

test('U moves right colors to F', () => {
  const f = toFacelets(applyMove(SOLVED, base('U')));
  for (const i of [8, 9]) assert.equal(f[i], 'R');
  for (const i of [10, 11]) assert.equal(f[i], 'G');
});

test('F moves left colors to U', () => {
  const f = toFacelets(applyMove(SOLVED, base('F')));
  for (const i of [2, 3]) assert.equal(f[i], 'O');
  for (const i of [0, 1]) assert.equal(f[i], 'W');
});

test('DBL never moves', () => {
  const s = applyMoves(SOLVED, parseMoves("R U F' U2 R2 F"));
  assert.equal(s.cp[6], 6);
  assert.equal(s.co[6], 0);
  assert.ok(!isSolved(s));
});

test('parseMoves round trip', () => {
  assert.equal(parseMoves("R U' F2").map(moveToString).join(' '), "R U' F2");
});

test('applyMove does not mutate input', () => {
  const copy = structuredClone(SOLVED);
  applyMove(SOLVED, base('R'));
  assert.deepEqual(SOLVED, copy);
});
