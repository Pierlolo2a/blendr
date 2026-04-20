/**
 * Blendr — Gestion des sons
 *
 * Sons simples générés en Web Audio API (pas de fichiers mp3 pour l'instant)
 */

window.Blendr = window.Blendr || {};

(function () {
  const { utils } = window.Blendr;

  let audioContext = null;

  function getContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  function isSoundEnabled() {
    return utils.storage.get('blendr.soundEnabled', true);
  }

  /**
   * Joue un son simple (fréquence + durée)
   */
  function playTone(frequency, duration = 0.1, type = 'sine') {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn('[sound] Erreur', err);
    }
  }

  /**
   * Son "pop" — joueur rejoint
   */
  function pop() {
    playTone(800, 0.08, 'sine');
  }

  /**
   * Son "ding" — début de tour
   */
  function ding() {
    const ctx = getContext();
    playTone(523, 0.1, 'sine');
    setTimeout(() => playTone(659, 0.15, 'sine'), 50);
  }

  /**
   * Son "swoosh" — validation
   */
  function swoosh() {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (err) {
      console.warn('[sound] Erreur', err);
    }
  }

  /**
   * Tic-tac (timer urgent)
   */
  function tick() {
    playTone(1200, 0.05, 'square');
  }

  /**
   * Countdown (3, 2, 1, GO)
   */
  function countdown() {
    playTone(440, 0.15);
  }

  function countdownGo() {
    const ctx = getContext();
    playTone(523, 0.1);
    setTimeout(() => playTone(659, 0.2), 80);
  }

  window.Blendr.sounds = {
    pop,
    ding,
    swoosh,
    tick,
    countdown,
    countdownGo,
  };
})();
