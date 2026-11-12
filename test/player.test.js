import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, TEMPI } from '../src/player.js';

function fakeClock() {
  const timers = new Map();
  let id = 0;
  const delays = [];
  return {
    delays,
    cleared: [],
    setTimeout(fn, ms) {
      delays.push(ms);
      timers.set(++id, fn);
      return id;
    },
    clearTimeout(t) {
      this.cleared.push(t);
      timers.delete(t);
    },
    pending: () => timers.size,
    async fire() {
      const [t, fn] = timers.entries().next().value;
      timers.delete(t);
      fn();
      await flush();
    },
  };
}
const flush = () => new Promise((r) => setImmediate(r));

test('TEMPI values', () => {
  assert.deepEqual(TEMPI, { langsam: 1500, normal: 800, schnell: 300 });
});

test('plays until step returns false', async () => {
  const clock = fakeClock();
  const results = [true, true, false];
  let calls = 0;
  const changes = [];
  const player = createPlayer({
    step: async () => results[calls++],
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
    onChange: (p) => changes.push(p),
  });
  assert.equal(player.tempo, 'normal');
  player.play();
  await flush();
  await clock.fire();
  await clock.fire();
  assert.equal(calls, 3);
  assert.deepEqual(clock.delays, [800, 800]);
  assert.equal(player.playing, false);
  assert.deepEqual(changes, [true, false]);
  assert.equal(clock.pending(), 0);
});

test('pause stops scheduling', async () => {
  const clock = fakeClock();
  let calls = 0;
  const player = createPlayer({
    step: async () => (calls++, true),
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
  });
  player.play();
  await flush();
  assert.equal(clock.pending(), 1);
  player.pause();
  assert.equal(clock.pending(), 0);
  assert.equal(clock.cleared.length, 1);
  assert.equal(player.playing, false);
  assert.equal(calls, 1);
});

test('pause during pending step', async () => {
  const clock = fakeClock();
  let resolve;
  const player = createPlayer({
    step: () => new Promise((r) => { resolve = r; }),
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
  });
  player.play();
  player.pause();
  resolve(true);
  await flush();
  assert.equal(clock.pending(), 0);
  assert.equal(player.playing, false);
});

test('tempo sets delay', async () => {
  const clock = fakeClock();
  const player = createPlayer({
    step: async () => true,
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
  });
  player.setTempo('schnell');
  assert.equal(player.tempo, 'schnell');
  player.play();
  await flush();
  assert.deepEqual(clock.delays, [300]);
  player.pause();
  assert.throws(() => player.setTempo('turbo'));
});

test('toggle', async () => {
  const clock = fakeClock();
  const player = createPlayer({
    step: async () => true,
    setTimeout: clock.setTimeout.bind(clock),
    clearTimeout: clock.clearTimeout.bind(clock),
  });
  player.toggle();
  assert.equal(player.playing, true);
  await flush();
  player.toggle();
  assert.equal(player.playing, false);
});
