import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAction } from '../src/keys.js';

const el = (tagName, attrs = {}) => ({ tagName, getAttribute: (n) => attrs[n] ?? null });

test('mappings', () => {
  assert.equal(keyAction({ key: 'ArrowLeft' }), 'prev');
  assert.equal(keyAction({ key: 'ArrowRight' }), 'next');
  assert.equal(keyAction({ key: 'Home' }), 'first');
  assert.equal(keyAction({ key: 'End' }), 'last');
  assert.equal(keyAction({ key: ' ', target: el('BODY') }), 'toggle');
  assert.equal(keyAction({ key: 'a' }), null);
});

test('modifiers and form fields', () => {
  assert.equal(keyAction({ key: 'ArrowRight', ctrlKey: true }), null);
  assert.equal(keyAction({ key: 'ArrowRight', metaKey: true }), null);
  assert.equal(keyAction({ key: 'ArrowRight', altKey: true }), null);
  for (const t of ['INPUT', 'SELECT', 'TEXTAREA']) assert.equal(keyAction({ key: 'ArrowRight', target: el(t) }), null);
});

test('palette radios and space on buttons keep their own behaviour', () => {
  assert.equal(keyAction({ key: 'ArrowRight', target: el('BUTTON', { role: 'radio' }) }), null);
  assert.equal(keyAction({ key: ' ', target: el('BUTTON') }), null);
  assert.equal(keyAction({ key: 'ArrowRight', target: el('BUTTON') }), 'next');
});
