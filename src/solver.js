// Optimal 2x2 solver: breadth-first search from the solved state over all
// 7! * 3^6 = 3,674,160 states, then greedy descent along the distance table.
import { MOVES, SOLVED, applyMove } from './cube.js';

const N_PERM = 5040; // 7!
const N_ORI = 729; // 3^6
export const N_STATES = N_PERM * N_ORI;
const N_MOVES = MOVES.length;
const UNVISITED = 255;

// Positions that can move (all but DBL = 6).
const FREE = [0, 1, 2, 3, 4, 5, 7];
const toSlot = (v) => (v < 6 ? v : v - 1); // corner id -> 0..6
const fromSlot = (s) => (s < 6 ? s : s + 1);

function permIndex(cp) {
  const vals = FREE.map((i) => toSlot(cp[i]));
  let idx = 0;
  for (let i = 0; i < 7; i++) {
    let smaller = 0;
    for (let j = i + 1; j < 7; j++) if (vals[j] < vals[i]) smaller++;
    idx = idx * (7 - i) + smaller;
  }
  return idx;
}

function permFromIndex(idx) {
  const digits = new Array(7);
  for (let i = 6; i >= 0; i--) {
    digits[i] = idx % (7 - i);
    idx = Math.floor(idx / (7 - i));
  }
  const pool = [0, 1, 2, 3, 4, 5, 6];
  const cp = new Array(8);
  cp[6] = 6;
  FREE.forEach((pos, i) => {
    cp[pos] = fromSlot(pool.splice(digits[i], 1)[0]);
  });
  return cp;
}

function oriIndex(co) {
  let idx = 0;
  for (let i = 0; i < 6; i++) idx = idx * 3 + co[i];
  return idx;
}

function oriFromIndex(idx) {
  const co = new Array(8).fill(0);
  let sum = 0;
  for (let i = 5; i >= 0; i--) {
    co[i] = idx % 3;
    sum += co[i];
    idx = Math.floor(idx / 3);
  }
  co[7] = (3 - (sum % 3)) % 3;
  return co;
}

/** State -> 0..3674159 (solved = 0). Assumes DBL is in place. */
export function encode(state) {
  return permIndex(state.cp) * N_ORI + oriIndex(state.co);
}

export function decode(index) {
  return { cp: permFromIndex(Math.floor(index / N_ORI)), co: oriFromIndex(index % N_ORI) };
}

function buildMoveTables() {
  const permMove = new Uint16Array(N_PERM * N_MOVES);
  const oriMove = new Uint16Array(N_ORI * N_MOVES);
  const zeroCo = SOLVED.co;
  const idCp = SOLVED.cp;
  for (let p = 0; p < N_PERM; p++) {
    const s = { cp: permFromIndex(p), co: zeroCo };
    MOVES.forEach((m, k) => {
      permMove[p * N_MOVES + k] = permIndex(applyMove(s, m).cp);
    });
  }
  for (let o = 0; o < N_ORI; o++) {
    const s = { cp: idCp, co: oriFromIndex(o) };
    MOVES.forEach((m, k) => {
      oriMove[o * N_MOVES + k] = oriIndex(applyMove(s, m).co);
    });
  }
  return { permMove, oriMove };
}

/**
 * Builds the full distance table (~3.7 MB, around a second).
 * @returns {{ solve(state): Move[], distance(state): number, maxDistance: number, unreached: number }}
 */
export function createSolver() {
  const { permMove, oriMove } = buildMoveTables();
  const next = (idx, k) =>
    permMove[Math.floor(idx / N_ORI) * N_MOVES + k] * N_ORI + oriMove[(idx % N_ORI) * N_MOVES + k];

  const dist = new Uint8Array(N_STATES).fill(UNVISITED);
  const queue = new Uint32Array(N_STATES);
  let head = 0;
  let tail = 0;
  dist[0] = 0;
  queue[tail++] = 0;
  while (head < tail) {
    const idx = queue[head++];
    const d = dist[idx] + 1;
    for (let k = 0; k < N_MOVES; k++) {
      const n = next(idx, k);
      if (dist[n] === UNVISITED) {
        dist[n] = d;
        queue[tail++] = n;
      }
    }
  }

  let maxDistance = 0;
  let unreached = 0;
  for (let i = 0; i < N_STATES; i++) {
    if (dist[i] === UNVISITED) unreached++;
    else if (dist[i] > maxDistance) maxDistance = dist[i];
  }

  return {
    maxDistance,
    unreached,
    distance: (state) => dist[encode(state)],
    solve(state) {
      let idx = encode(state);
      const moves = [];
      while (dist[idx] > 0) {
        const target = dist[idx] - 1;
        const k = MOVES.findIndex((_, j) => dist[next(idx, j)] === target);
        moves.push(MOVES[k]);
        idx = next(idx, k);
      }
      return moves;
    },
  };
}
