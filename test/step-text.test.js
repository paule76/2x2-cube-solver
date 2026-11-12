import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoves } from '../src/cube.js';
import { stepText, describeMove } from '../src/step-text.js';

const moves = parseMoves("F' U R2");

test('describeMove', () => {
  assert.equal(describeMove(moves[0]), "F' – vordere Seite gegen den Uhrzeigersinn");
  assert.equal(describeMove(moves[2]), 'R2 – rechte Seite halbe Drehung (180°)');
});

test('each move is announced exactly once, as the next thing to do', () => {
  assert.equal(stepText(moves, 0), "Schritt 1 von 3: F' – vordere Seite gegen den Uhrzeigersinn");
  assert.equal(stepText(moves, 1), 'Schritt 2 von 3: U – obere Seite im Uhrzeigersinn');
  assert.equal(stepText(moves, 2), 'Schritt 3 von 3: R2 – rechte Seite halbe Drehung (180°)');
  assert.equal(stepText(moves, 3), 'Fertig – der Würfel ist gelöst! 🎉');
  const texts = [0, 1, 2, 3].map((k) => stepText(moves, k));
  for (const m of ["F'", 'U ', 'R2']) assert.equal(texts.filter((t) => t.includes(m)).length, 1, m);
});
