// Autoplay: calls step() repeatedly with a pause between moves.
// The clock is injected so the logic can be tested without real time.

export const TEMPI = Object.freeze({ langsam: 1500, normal: 800, schnell: 300 });

/**
 * @param {{ step: () => Promise<boolean>, setTimeout: Function, clearTimeout: Function,
 *           onChange?: (playing: boolean) => void }} options
 */
export function createPlayer({ step, setTimeout, clearTimeout, onChange = () => {} }) {
  let playing = false;
  let tempo = 'normal';
  let timer = null;
  let run = 0; // invalidates steps that finish after a pause

  function setPlaying(value) {
    if (playing === value) return;
    playing = value;
    onChange(playing);
  }

  async function tick(token) {
    timer = null;
    const more = await step();
    if (token !== run || !playing) return;
    if (!more) {
      setPlaying(false);
      return;
    }
    timer = setTimeout(() => tick(token), TEMPI[tempo]);
  }

  const player = {
    get playing() {
      return playing;
    },
    get tempo() {
      return tempo;
    },
    play() {
      if (playing) return;
      setPlaying(true);
      tick(++run);
    },
    pause() {
      run++;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      setPlaying(false);
    },
    toggle() {
      if (playing) player.pause();
      else player.play();
    },
    setTempo(name) {
      if (!(name in TEMPI)) throw new Error(`Unbekanntes Tempo: ${name}`);
      tempo = name;
    },
  };
  return player;
}
