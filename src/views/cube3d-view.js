// 3D view: the cube as 8 CSS-3D cubies. Implements the view interface
// { render(facelets), showMove(move, direction), showHint(move|null), highlight(index|null) }.
import { STICKERS, CUBIES, FACE_NORMALS } from '../geometry.js';

const DEFAULT_CAMERA = { x: -25, y: -35 };
const DRAG_THRESHOLD = 5; // px before a press counts as camera drag
const DEG_PER_PX = 0.5;

// CSS placement of a cubie face (CSS y points down).
const FACE_TRANSFORMS = {
  U: 'rotateX(90deg)',
  D: 'rotateX(-90deg)',
  F: '',
  B: 'rotateY(180deg)',
  R: 'rotateY(90deg)',
  L: 'rotateY(-90deg)',
};

const sameVec = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const NO_ROTATION = 'rotateX(0deg)';

/**
 * @param {HTMLElement} container
 * @param {{ onStickerClick?(index: number): void }} [options]
 */
export function createCube3dView(container, { onStickerClick = () => {} } = {}) {
  const camera = { ...DEFAULT_CAMERA };
  const stickers = new Array(24);
  const cubies = [];

  container.classList.add('cube3d');
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', '3D-Ansicht des Würfels (ziehen zum Drehen)');
  const scene = document.createElement('div');
  scene.className = 'scene';
  const cam = document.createElement('div');
  cam.className = 'camera';
  scene.append(cam);
  container.replaceChildren(scene);

  for (const position of CUBIES) {
    const el = document.createElement('div');
    el.className = 'cubie';
    const translate = `translate3d(calc(${position[0]} * var(--h)), calc(${-position[1]} * var(--h)), calc(${position[2]} * var(--h)))`;
    for (const [face, normal] of Object.entries(FACE_NORMALS)) {
      const f = document.createElement('div');
      f.className = 'cubie-face';
      f.style.transform = `${FACE_TRANSFORMS[face]} translateZ(var(--h))`;
      const index = STICKERS.findIndex((s) => sameVec(s.position, position) && sameVec(s.normal, normal));
      if (index >= 0) {
        const sticker = document.createElement('div');
        sticker.className = 'sticker';
        sticker.dataset.index = String(index);
        stickers[index] = sticker;
        f.append(sticker);
      }
      el.append(f);
    }
    cubies.push({ el, position, translate });
    cam.append(el);
  }

  function resetCubies() {
    for (const c of cubies) {
      c.el.style.transition = 'none';
      c.el.style.transform = `${NO_ROTATION} ${c.translate}`;
    }
  }

  function applyCamera() {
    cam.style.transform = `rotateX(${camera.x}deg) rotateY(${camera.y}deg)`;
  }

  // Camera drag (pointer events). A press only becomes a drag after DRAG_THRESHOLD px,
  // so a plain click still reaches the sticker.
  let press = null;
  let suppressClick = false;
  container.addEventListener('pointerdown', (e) => {
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, cam: { ...camera }, dragging: false };
    suppressClick = false;
  });
  container.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!press.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      press.dragging = true;
      suppressClick = true;
      container.setPointerCapture?.(e.pointerId);
      container.classList.add('dragging');
    }
    if (press.dragging) {
      camera.y = press.cam.y + dx * DEG_PER_PX;
      camera.x = Math.max(-90, Math.min(90, press.cam.x - dy * DEG_PER_PX));
      applyCamera();
    }
  });
  const endPress = (e) => {
    if (press && e.pointerId === press.id) {
      press = null;
      container.classList.remove('dragging');
    }
  };
  container.addEventListener('pointerup', endPress);
  container.addEventListener('pointercancel', endPress);
  container.addEventListener('click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const sticker = e.target.closest?.('.sticker');
    if (sticker) onStickerClick(Number(sticker.dataset.index));
  });

  resetCubies();
  applyCamera();

  return {
    render(facelets) {
      resetCubies();
      facelets.forEach((color, i) => {
        stickers[i].dataset.color = color ?? '';
      });
    },
    showMove() {
      return Promise.resolve();
    },
    showHint() {},
    highlight(index) {
      stickers.forEach((s, i) => s.classList.toggle('highlighted', i === index));
    },
    resetCamera() {
      Object.assign(camera, DEFAULT_CAMERA);
      applyCamera();
    },
  };
}
