// Two-step confirmation: the first press arms, a second press within
// `timeoutMs` confirms. The clock is injected for tests.

/**
 * @param {{ timeoutMs?: number, setTimeout: Function, clearTimeout: Function,
 *           onArm?: () => void, onDisarm?: () => void }} options
 */
export function createConfirm({ timeoutMs = 3000, setTimeout, clearTimeout, onArm = () => {}, onDisarm = () => {} }) {
  let timer = null;

  function disarm() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    onDisarm();
  }

  return {
    get armed() {
      return timer !== null;
    },
    /** Returns true when the action should run now. */
    press() {
      if (timer !== null) {
        disarm();
        return true;
      }
      timer = setTimeout(() => {
        timer = null;
        onDisarm();
      }, timeoutMs);
      onArm();
      return false;
    },
    reset: disarm,
  };
}
