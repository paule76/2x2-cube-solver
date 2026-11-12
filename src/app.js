import { SOLVED, COLOR_NAMES, toFacelets, parseFacelets, applyMoves, moveToString } from './cube.js';
import { createSolver } from './solver.js';
import { createNetView } from './views/net-view.js';
import { createCube3dView } from './views/cube3d-view.js';
import { createStepper } from './stepper.js';
import { stepText, describeMove } from './step-text.js';
import { createPlayer } from './player.js';
import { keyAction } from './keys.js';

const COLORS = ['W', 'Y', 'G', 'B', 'R', 'O'];

const $ = (id) => document.getElementById(id);

let solver = null;
let selected = 'W';
let input = toFacelets(SOLVED);
/** @type {null | { state, scheme, moves: object[], step: number }} */
let solution = null;

const net = createNetView($('net'), {
  onCellClick,
  onCellHover: (index) => cube3d.highlight(index),
  colorName: (c) => (c ? COLOR_NAMES[c] : 'leer'),
});
const cube3d = createCube3dView($('cube3d'), {
  onStickerClick: (index) => net.highlight(index),
});
const views = [net, cube3d];

// Fans the view interface out to all views; showMove waits for every view.
const view = {
  render: (facelets) => views.forEach((v) => v.render(facelets)),
  showMove: (move, direction) => Promise.all(views.map((v) => v.showMove(move, direction))),
  showHint: (move) => views.forEach((v) => v.showHint?.(move)),
};

function displayed() {
  if (!solution) return input;
  return toFacelets(applyMoves(solution.state, solution.moves.slice(0, solution.step)), solution.scheme);
}

function setMessage(text, kind = '') {
  const el = $('message');
  el.textContent = text;
  el.className = `message ${kind}`.trim();
}

function onCellClick(index) {
  if (solution) {
    // Editing during navigation: continue from what is shown, drop the stale solution.
    input = displayed();
    clearSolution();
  }
  input[index] = selected;
  setMessage('');
  render();
}

function clearSolution() {
  player.pause();
  solution = null;
  $('solution').hidden = true;
}

function solve() {
  if (!solver) return;
  player.pause();
  const r = parseFacelets(input);
  if (!r.ok) {
    clearSolution();
    setMessage(r.error, 'error');
    render();
    return;
  }
  const moves = solver.solve(r.state);
  if (moves.length === 0) {
    clearSolution();
    setMessage('Schon gelöst!', 'success');
    render();
    return;
  }
  solution = { state: r.state, scheme: r.scheme, moves, step: 0 };
  setMessage(`Lösung gefunden: ${moves.length} ${moves.length === 1 ? 'Zug' : 'Züge'}.`, 'success');
  $('solution').hidden = false;
  render();
}

const stepper = createStepper(view, () => solution);

async function goTo(step) {
  // No disabling of the nav buttons here: that would drop keyboard focus during the
  // animation. The stepper itself ignores navigation while a move is shown.
  if (stepper.busy) return;
  await stepper.goTo(step);
  render();
}

const atEnd = () => !solution || solution.step >= solution.moves.length;

const player = createPlayer({
  async step() {
    if (atEnd()) return false;
    await goTo(solution.step + 1);
    return !atEnd();
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (t) => clearTimeout(t),
  onChange: (playing) => {
    $('play').textContent = playing ? '⏸ Pause' : '▶ Abspielen';
    $('play').setAttribute('aria-pressed', String(playing));
  },
});

function togglePlay() {
  if (!solution) return;
  if (!player.playing && atEnd()) {
    solution.step = 0; // replay from the start
    render();
  }
  player.toggle();
}

/** Manual navigation stops autoplay. */
function navigate(action) {
  if (!solution) return;
  if (action === 'toggle') return togglePlay();
  player.pause();
  const target = { first: 0, prev: solution.step - 1, next: solution.step + 1, last: solution.moves.length }[action];
  goTo(target);
}


function renderSolution() {
  if (!solution) return;
  const { moves, step } = solution;
  const list = $('moves');
  list.replaceChildren(
    ...moves.map((m, i) => {
      const li = document.createElement('li');
      li.textContent = moveToString(m);
      if (i < step) li.className = 'done';
      if (i === step) li.className = 'current';
      li.title = describeMove(m);
      return li;
    }),
  );
  $('step-text').textContent = stepText(moves, step);
  $('first').disabled = $('prev').disabled = step === 0;
  $('next').disabled = $('last').disabled = step === moves.length;
}

function renderPalette() {
  for (const btn of $('palette').children) {
    const on = btn.dataset.color === selected;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  }
}

function render() {
  view.render(displayed());
  view.showHint(solution && solution.step < solution.moves.length ? solution.moves[solution.step] : null);
  renderPalette();
  renderSolution();
}

function buildPalette() {
  const palette = $('palette');
  for (const c of COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.color = c;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', COLOR_NAMES[c]);
    btn.title = COLOR_NAMES[c];
    btn.addEventListener('click', () => {
      selected = c;
      renderPalette();
    });
    palette.append(btn);
  }
  palette.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    selected = COLORS[(COLORS.indexOf(selected) + step + COLORS.length) % COLORS.length];
    renderPalette();
    palette.querySelector(`[data-color="${selected}"]`).focus();
  });
}

buildPalette();
$('solve').addEventListener('click', solve);
$('reset-camera').addEventListener('click', () => cube3d.resetCamera());
$('reset').addEventListener('click', () => {
  input = toFacelets(SOLVED);
  clearSolution();
  setMessage('');
  render();
});
$('clear').addEventListener('click', () => {
  input = new Array(24).fill(null);
  clearSolution();
  setMessage('');
  render();
});
for (const action of ['first', 'prev', 'next', 'last']) {
  $(action).addEventListener('click', () => navigate(action));
}
$('play').addEventListener('click', togglePlay);
$('tempo').addEventListener('change', (e) => player.setTempo(e.target.value));
document.addEventListener('keydown', (e) => {
  if (!solution) return;
  const action = keyAction(e);
  if (!action) return;
  e.preventDefault();
  navigate(action);
});
render();

// Let the page paint before the ~0.5 s table build.
setTimeout(() => {
  solver = createSolver();
  $('solve').disabled = false;
  if ($('message').textContent === 'Initialisiere Solver…') setMessage('Bereit.');
}, 0);
