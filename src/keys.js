// Keyboard shortcuts for the solution navigation.

const ACTIONS = { ArrowLeft: 'prev', ArrowRight: 'next', Home: 'first', End: 'last', ' ': 'toggle' };
const FORM_FIELDS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

/**
 * @param {{ key: string, ctrlKey?: boolean, metaKey?: boolean, altKey?: boolean,
 *           target?: { tagName?: string, getAttribute?: (name: string) => string|null } }} e
 * @returns {'prev'|'next'|'first'|'last'|'toggle'|null}
 */
export function keyAction(e) {
  const action = ACTIONS[e.key] ?? null;
  if (!action || e.ctrlKey || e.metaKey || e.altKey) return null;
  const tag = e.target?.tagName;
  if (FORM_FIELDS.has(tag)) return null;
  if (e.target?.getAttribute?.('role') === 'radio') return null; // palette uses arrow keys
  if (action === 'toggle' && tag === 'BUTTON') return null; // space activates the button itself
  return action;
}
