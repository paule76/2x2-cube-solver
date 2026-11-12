import { moveToString } from './cube.js';

const FACE_TEXT = { U: 'obere Seite', R: 'rechte Seite', F: 'vordere Seite' };
const TURN_TEXT = { 1: 'im Uhrzeigersinn', [-1]: 'gegen den Uhrzeigersinn', 2: 'halbe Drehung (180°)' };

export function describeMove(m) {
  return `${moveToString(m)} – ${FACE_TEXT[m.face]} ${TURN_TEXT[m.turns]}`;
}

/** Text for `step` moves done: announces the next move to do, or that the cube is solved. */
export function stepText(moves, step) {
  if (step >= moves.length) return 'Fertig – der Würfel ist gelöst! 🎉';
  return `Schritt ${step + 1} von ${moves.length}: ${describeMove(moves[step])}`;
}
