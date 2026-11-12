import { SOLVED, COLOR_NAMES, toFacelets, parseFacelets, applyMoves, moveToString } from './cube.js';
import { createSolver } from './solver.js';
import { createNetView } from './views/net-view.js';

const COLORS = ['W', 'Y', 'G', 'B', 'R', 'O'];
const FACE_TEXT = { U: 'obere Seite', R: 'rechte Seite', F: 'vordere Seite' };
const TURN_TEXT = { 1: 'im Uhrzeigersinn', [-1]: 'gegen den Uhrzeigersinn', 2: 'halbe Drehung (180°)' };

const $ = (id) => document.getElementById(id);
const describe = (m) => `${moveToString(m)} – ${FACE_TEXT[m.face]} ${TURN_TEXT[m.turns]}`;

let solver = null;
let selected = 'W';
let input = toFacelets(SOLVED);
/** @type {null | { state, scheme, moves: object[], step: number }} */
let solution = null;

const view = createNetView($('net'), {
  onCellClick,
  colorName: (c) => (c ? COLOR_NAMES[c] : 'leer'),
});

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
  solution = null;
  $('solution').hidden = true;
}

function solve() {
  if (!solver) return;
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

async function goTo(step, direction) {
  if (!solution) return;
  const target = Math.max(0, Math.min(solution.moves.length, step));
  if (target === solution.step) return;
  if (Math.abs(target - solution.step) === 1) {
    const move = direction > 0 ? solution.moves[solution.step] : solution.moves[target];
    await view.showMove(move, direction);
  }
  solution.step = target;
  render();
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
      if (i === step - 1) li.classList.add('current');
      li.title = describe(m);
      return li;
    }),
  );
  let text;
  if (step === 0) text = `Ausgangslage. Nächster Zug: ${describe(moves[0])}`;
  else text = `Schritt ${step} von ${moves.length}: ${describe(moves[step - 1])}`;
  if (step === moves.length) text += ' – geschafft, der Würfel ist gelöst! 🎉';
  $('step-text').textContent = text;
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
$('first').addEventListener('click', () => goTo(0, -1));
$('prev').addEventListener('click', () => goTo(solution.step - 1, -1));
$('next').addEventListener('click', () => goTo(solution.step + 1, 1));
$('last').addEventListener('click', () => goTo(solution.moves.length, 1));
render();

// Let the page paint before the ~0.5 s table build.
setTimeout(() => {
  solver = createSolver();
  $('solve').disabled = false;
  if ($('message').textContent === 'Initialisiere Solver…') setMessage('Bereit.');
}, 0);
