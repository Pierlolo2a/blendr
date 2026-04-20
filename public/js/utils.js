/**
 * Blendr — Utilitaires partagés
 */

window.Blendr = window.Blendr || {};

window.Blendr.utils = {
  /**
   * Affiche un toast temporaire.
   * @param {string} message
   * @param {'info'|'error'|'success'} [type]
   * @param {number} [duration] ms
   */
  toast(message, type = 'info', duration = 2600) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast toast--visible';
    if (type === 'error') el.classList.add('toast--error');
    if (type === 'success') el.classList.add('toast--success');
    clearTimeout(Blendr.utils._toastTimer);
    Blendr.utils._toastTimer = setTimeout(() => {
      el.className = 'toast';
    }, duration);
  },

  /**
   * Valide un pseudo côté client.
   * @param {string} pseudo
   * @returns {{ ok: boolean, error?: string }}
   */
  validatePseudo(pseudo) {
    const p = (pseudo || '').trim();
    if (!p) return { ok: false, error: 'Entre un pseudo' };
    if (p.length < 2) return { ok: false, error: 'Au moins 2 caractères' };
    if (p.length > 16) return { ok: false, error: 'Maximum 16 caractères' };
    if (!/^[a-zA-Z0-9_-]+$/.test(p)) {
      return {
        ok: false,
        error: 'Lettres, chiffres, _ et - uniquement',
      };
    }
    return { ok: true };
  },

  /**
   * Auto-format du code d'invitation : MAJUSCULES + 5 caractères.
   */
  formatInviteCode(value) {
    return (value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
  },

  /**
   * Ajoute/enlève une classe d'animation en la redémarrant proprement.
   */
  triggerAnimation(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth; // force reflow
    el.classList.add(className);
  },

  /**
   * Fait trembler un élément (erreur) pendant 400ms.
   */
  shake(el) {
    this.triggerAnimation(el, 'anim-shake');
  },

  /**
   * localStorage avec fallback silencieux.
   */
  storage: {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota / private mode */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* noop */
      }
    },
  },

  /**
   * Messages d'erreur lisibles renvoyés par le serveur.
   */
  errorMessage(code) {
    const map = {
      PSEUDO_INVALID: 'Pseudo invalide.',
      PSEUDO_TAKEN: 'Ce pseudo est déjà utilisé dans cette partie.',
      AVATAR_INVALID: 'Avatar invalide.',
      ROOM_NOT_FOUND: "Ce code ne correspond à aucune partie.",
      ROOM_FULL: 'La partie est pleine (12 joueurs max).',
      GAME_IN_PROGRESS: 'La partie a déjà commencé.',
      RATE_LIMITED: 'Doucement ! Trop de requêtes, réessaie dans un instant.',
      SERVER_FULL: 'Le serveur est saturé. Réessaie plus tard.',
      NOT_IN_ROOM: "Tu n'es pas dans cette partie.",
      EMPTY_MESSAGE: 'Message vide.',
      NOT_PLAYING: "La partie n'est pas en cours.",
      INVALID_TYPE: 'Type de soumission invalide.',
      INVALID_IMAGE: 'Image invalide ou trop lourde.',
      ALREADY_SUBMITTED: 'Tu as déjà soumis pour ce tour.',
    };
    return map[code] || 'Une erreur est survenue.';
  },
};
