// 3D geometry of the 2x2 cube, consistent with the facelet order in cube.js.
// Coordinates: x → right (R), y → up (U), z → front (F). Cubies sit at (±1, ±1, ±1).

export const FACE_NORMALS = Object.freeze({
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
});

// Sticker positions per face, in net reading order (see cube.js facelet order).
const FACE_POSITIONS = {
  U: [[-1, 1, -1], [1, 1, -1], [-1, 1, 1], [1, 1, 1]],
  R: [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]],
  F: [[-1, 1, 1], [1, 1, 1], [-1, -1, 1], [1, -1, 1]],
  D: [[-1, -1, 1], [1, -1, 1], [-1, -1, -1], [1, -1, -1]],
  L: [[-1, 1, -1], [-1, 1, 1], [-1, -1, -1], [-1, -1, 1]],
  B: [[1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]],
};

/** @type {{position:number[], normal:number[]}[]} index = facelet index */
export const STICKERS = Object.freeze(
  [...'URFDLB'].flatMap((face) =>
    FACE_POSITIONS[face].map((position) => Object.freeze({ position, normal: FACE_NORMALS[face] })),
  ),
);

export const CUBIES = Object.freeze(
  [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z]))),
);

const AXIS_OF = { U: 'y', D: 'y', R: 'x', L: 'x', F: 'z', B: 'z' };

/** True if the cubie at `position` belongs to the layer of `face`. */
export function inLayer(position, face) {
  const n = FACE_NORMALS[face];
  return position[0] * n[0] + position[1] * n[1] + position[2] * n[2] === 1;
}

/** Clockwise (looking at the face) = −90° about the outward normal. */
export function rotation(move) {
  return { axis: AXIS_OF[move.face], degrees: -90 * move.turns };
}

/** Right-handed rotation of an integer vector; result rounded to integers. */
export function rotateVec(v, axis, degrees) {
  const a = (degrees * Math.PI) / 180;
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  const [x, y, z] = v;
  let r;
  if (axis === 'x') r = [x, c * y - s * z, s * y + c * z];
  else if (axis === 'y') r = [c * x + s * z, y, -s * x + c * z];
  else r = [c * x - s * y, s * x + c * y, z];
  return r.map((n) => n || 0); // normalise -0
}

/** CSS transform for a math-space rotation (CSS has y pointing down). */
export function cssRotate({ axis, degrees }) {
  const sign = axis === 'y' ? 1 : -1;
  return `rotate${axis.toUpperCase()}(${(sign * degrees) || 0}deg)`;
}

