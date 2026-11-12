import { MOVES } from './cube.js';

const FACES = ['U', 'R', 'F'];
const TURNS = [1, 2, -1];

/**
 * Random move sequence for practice. Never turns the same face twice in a row,
 * so no moves cancel or merge.
 * @param {number} [length=12]
 * @param {() => number} [rng=Math.random] returns numbers in [0, 1)
 */
export function randomScramble(length = 12, rng = Math.random) {
  const moves = [];
  let last = null;
  for (let i = 0; i < length; i++) {
    const faces = FACES.filter((f) => f !== last);
    const face = faces[Math.floor(rng() * faces.length)];
    const turns = TURNS[Math.floor(rng() * TURNS.length)];
    moves.push(MOVES.find((m) => m.face === face && m.turns === turns));
    last = face;
  }
  return moves;
}
