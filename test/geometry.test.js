import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOLVED, MOVES, applyMove, toFacelets } from '../src/cube.js';
import { STICKERS, FACE_NORMALS, CUBIES, inLayer, rotation, rotateVec, cssRotate } from '../src/geometry.js';
import { randomMoves } from './helpers.js';

const key = (p, n) => `${p}|${n}`;
const lookup = new Map(STICKERS.map((s, i) => [key(s.position, s.normal), i]));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function simulate(facelets, move) {
  const { axis, degrees } = rotation(move);
  const out = new Array(24);
  STICKERS.forEach((s, i) => {
    let { position, normal } = s;
    if (inLayer(position, move.face)) {
      position = rotateVec(position, axis, degrees);
      normal = rotateVec(normal, axis, degrees);
    }
    const j = lookup.get(key(position, normal));
    assert.notEqual(j, undefined);
    out[j] = facelets[i];
  });
  return out;
}

test('stickers are unique and on their face', () => {
  assert.equal(STICKERS.length, 24);
  assert.equal(lookup.size, 24);
  STICKERS.forEach((s, i) => {
    assert.deepEqual(s.normal, FACE_NORMALS['URFDLB'[(i / 4) | 0]]);
    assert.equal(dot(s.position, s.normal), 1);
  });
});

test('layer membership', () => {
  assert.equal(CUBIES.length, 8);
  for (const f of 'URFDLB') assert.equal(CUBIES.filter((p) => inLayer(p, f)).length, 4, f);
});

test('3D rotation matches model', () => {
  for (const m of MOVES) {
    assert.deepEqual(simulate(toFacelets(SOLVED), m), toFacelets(applyMove(SOLVED, m)), JSON.stringify(m));
  }
  for (let i = 0; i < 200; i++) {
    let s = SOLVED;
    let f = toFacelets(s);
    for (const m of randomMoves(1 + (i % 15))) {
      s = applyMove(s, m);
      f = simulate(f, m);
    }
    assert.deepEqual(f, toFacelets(s));
  }
});

test('css rotation equals math rotation under y-flip', () => {
  const rad = (d) => (d * Math.PI) / 180;
  const css = {
    X: (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]],
    Y: (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]],
    Z: (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]],
  };
  const M = [1, -1, 1];
  for (const m of MOVES) {
    const r = rotation(m);
    const [, ax, deg] = /^rotate([XYZ])\((-?[\d.]+)deg\)$/.exec(cssRotate(r));
    const C = css[ax](rad(Number(deg)));
    for (const basis of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const expected = rotateVec(basis, r.axis, r.degrees);
      // M · C · M · basis
      const v = basis.map((x, k) => x * M[k]);
      const cv = C.map((row) => dot(row, v));
      const got = cv.map((x, k) => Math.round(x * M[k]) || 0);
      assert.deepEqual(got, expected, `${JSON.stringify(m)} ${cssRotate(r)}`);
    }
  }
});
