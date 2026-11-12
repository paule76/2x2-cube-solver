import { MOVES, SOLVED, applyMoves } from '../src/cube.js';

export function randomMoves(n) {
  return Array.from({ length: n }, () => MOVES[Math.floor(Math.random() * MOVES.length)]);
}

export function randomState(n = 15) {
  return applyMoves(SOLVED, randomMoves(n));
}
