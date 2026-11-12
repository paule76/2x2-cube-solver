import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createConfirm } from '../src/confirm.js';

let clock;
let events;
let c;

beforeEach(() => {
  const timers = new Map();
  let id = 0;
  clock = {
    delays: [],
    setTimeout: (fn, ms) => { clock.delays.push(ms); timers.set(++id, fn); return id; },
    clearTimeout: (t) => timers.delete(t),
    pending: () => timers.size,
    fireAll: () => { for (const [t, fn] of [...timers]) { timers.delete(t); fn(); } },
  };
  events = [];
  c = createConfirm({
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onArm: () => events.push('arm'),
    onDisarm: () => events.push('disarm'),
  });
});

test('first press arms, second confirms', () => {
  assert.equal(c.press(), false);
  assert.equal(c.armed, true);
  assert.deepEqual(clock.delays, [3000]);
  assert.equal(c.press(), true);
  assert.equal(c.armed, false);
  assert.equal(clock.pending(), 0);
  assert.deepEqual(events, ['arm', 'disarm']);
});

test('timeout disarms', () => {
  c.press();
  clock.fireAll();
  assert.equal(c.armed, false);
  assert.deepEqual(events, ['arm', 'disarm']);
  assert.equal(c.press(), false);
});

test('reset disarms without confirming', () => {
  c.press();
  c.reset();
  assert.equal(c.armed, false);
  assert.equal(clock.pending(), 0);
  assert.deepEqual(events, ['arm', 'disarm']);
});

test('reset when idle does nothing', () => {
  c.reset();
  assert.deepEqual(events, []);
});

test('custom timeout', () => {
  const d = createConfirm({ timeoutMs: 500, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  d.press();
  assert.deepEqual(clock.delays, [500]);
});
