/**
 * Blendr — Logique de la page d'accueil
 *
 * - Génération / sélection d'avatar
 * - Validation pseudo en temps réel
 * - Création / jonction d'une partie via Socket.IO
 * - Gestion du son global
 * - Pré-remplissage du code via /join/:code
 */

(function () {
  const { utils, avatars } = window.Blendr;

  // -------------------------------------------------------------------
  // Socket.IO
  // -------------------------------------------------------------------
  let socket = null;

  function connectSocket() {
    if (socket && socket.connected) return socket;
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('[socket] Connecté', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Déconnecté', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[socket] Erreur de connexion', err);
      utils.toast('Impossible de se connecter au serveur', 'error');
    });

    return socket;
  }

  // -------------------------------------------------------------------
  // Persistance locale
  // -------------------------------------------------------------------
  const STORAGE_KEYS = {
    pseudo: 'blendr.pseudo',
    avatarSeed: 'blendr.avatarSeed',
    soundEnabled: 'blendr.soundEnabled',
  };

  function loadProfile() {
    return {
      pseudo: utils.storage.get(STORAGE_KEYS.pseudo, ''),
      avatarSeed:
        utils.storage.get(STORAGE_KEYS.avatarSeed, null) ||
        avatars.randomSeed(),
    };
  }

  function saveProfile({ pseudo, avatarSeed }) {
    if (pseudo != null) utils.storage.set(STORAGE_KEYS.pseudo, pseudo);
    if (avatarSeed) utils.storage.set(STORAGE_KEYS.avatarSeed, avatarSeed);
  }

  // -------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const profile = loadProfile();

    setupAvatarPicker('avatar-create', 'avatar-create-shuffle', profile);
    setupAvatarPicker('avatar-join', 'avatar-join-shuffle', profile);

    setupPseudoField('pseudo-create', 'error-create', profile.pseudo);
    setupPseudoField('pseudo-join', null, profile.pseudo);

    setupCodeField('code-join');

    setupCreateButton();
    setupJoinButton();

    setupSoundToggle();
    prefillJoinCodeFromUrl();
  });

  // -------------------------------------------------------------------
  // Avatars
  // -------------------------------------------------------------------
  function setupAvatarPicker(avatarId, shuffleId, profile) {
    const container = document.getElementById(avatarId);
    const shuffle = document.getElementById(shuffleId);
    if (!container || !shuffle) return;

    avatars.render(container, profile.avatarSeed);

    shuffle.addEventListener('click', () => {
      const seed = avatars.randomSeed();
      avatars.render(container, seed);
      saveProfile({ avatarSeed: seed });

      document
        .querySelectorAll('.avatar-picker__avatar')
        .forEach((el) => avatars.render(el, seed));

      utils.triggerAnimation(shuffle, 'anim-spin');
    });
  }

  // -------------------------------------------------------------------
  // Pseudo
  // -------------------------------------------------------------------
  function setupPseudoField(inputId, errorId, initialValue) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (initialValue) input.value = initialValue;

    input.addEventListener('input', () => {
      const v = input.value;
      document.querySelectorAll('#pseudo-create, #pseudo-join').forEach((el) => {
        if (el !== input) el.value = v;
      });
      saveProfile({ pseudo: v });

      const err = document.getElementById(errorId || '');
      if (err) err.textContent = '';
    });
  }

  // -------------------------------------------------------------------
  // Code d'invitation
  // -------------------------------------------------------------------
  function setupCodeField(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
      input.value = utils.formatInviteCode(input.value);
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      input.value = utils.formatInviteCode(text);
    });
  }

  // -------------------------------------------------------------------
  // Création de partie
  // -------------------------------------------------------------------
  function setupCreateButton() {
    const btn = document.getElementById('btn-create');
    const pseudoInput = document.getElementById('pseudo-create');
    const avatarEl = document.getElementById('avatar-create');
    const errorEl = document.getElementById('error-create');
    if (!btn || !pseudoInput) return;

    btn.addEventListener('click', () => {
      const pseudo = pseudoInput.value.trim();
      const check = utils.validatePseudo(pseudo);
      if (!check.ok) {
        errorEl.textContent = check.error;
        utils.shake(pseudoInput);
        return;
      }

      const avatarSeed = avatarEl.dataset.seed;
      saveProfile({ pseudo, avatarSeed });

      btn.disabled = true;
      btn.textContent = 'Connexion...';

      const sock = connectSocket();
      sock.emit('room:create', { pseudo, avatar: avatarSeed }, (res) => {
        btn.disabled = false;
        btn.textContent = 'Créer';

        if (!res || !res.ok) {
          const errMsg = utils.errorMessage(res?.error);
          errorEl.textContent = errMsg;
          utils.toast(errMsg, 'error');
          utils.shake(pseudoInput);
          return;
        }

        console.log('[room:create] OK', res.code);
        window.location.href = `/lobby?code=${res.code}`;
      });
    });
  }

  // -------------------------------------------------------------------
  // Rejoindre une partie
  // -------------------------------------------------------------------
  function setupJoinButton() {
    const btn = document.getElementById('btn-join');
    const pseudoInput = document.getElementById('pseudo-join');
    const codeInput = document.getElementById('code-join');
    const avatarEl = document.getElementById('avatar-join');
    const errorEl = document.getElementById('error-join');
    if (!btn || !pseudoInput || !codeInput) return;

    btn.addEventListener('click', () => {
      const pseudo = pseudoInput.value.trim();
      const code = utils.formatInviteCode(codeInput.value);

      const check = utils.validatePseudo(pseudo);
      if (!check.ok) {
        errorEl.textContent = check.error;
        utils.shake(pseudoInput);
        return;
      }
      if (code.length !== 5) {
        errorEl.textContent = 'Le code doit contenir 5 caractères.';
        utils.shake(codeInput);
        return;
      }

      const avatarSeed = avatarEl.dataset.seed;
      saveProfile({ pseudo, avatarSeed });

      btn.disabled = true;
      btn.textContent = 'Connexion...';

      const sock = connectSocket();
      sock.emit('room:join', { code, pseudo, avatar: avatarSeed }, (res) => {
        btn.disabled = false;
        btn.textContent = 'Rejoindre';

        if (!res || !res.ok) {
          const errMsg = utils.errorMessage(res?.error);
          errorEl.textContent = errMsg;
          utils.toast(errMsg, 'error');
          utils.shake(codeInput);
          return;
        }

        console.log('[room:join] OK', res.code);
        window.location.href = `/lobby?code=${res.code}`;
      });
    });
  }

  // -------------------------------------------------------------------
  // Son
  // -------------------------------------------------------------------
  function setupSoundToggle() {
    const btn = document.getElementById('toggle-sound');
    if (!btn) return;
    const enabled = utils.storage.get(STORAGE_KEYS.soundEnabled, true);
    btn.setAttribute('aria-pressed', String(enabled));

    btn.addEventListener('click', () => {
      const isOn = btn.getAttribute('aria-pressed') === 'true';
      const next = !isOn;
      btn.setAttribute('aria-pressed', String(next));
      utils.storage.set(STORAGE_KEYS.soundEnabled, next);
      utils.toast(next ? 'Son activé' : 'Son coupé');
    });
  }

  // -------------------------------------------------------------------
  // Pré-remplissage depuis /join/:code
  // -------------------------------------------------------------------
  function prefillJoinCodeFromUrl() {
    const match = window.location.pathname.match(/^\/join\/([A-Z0-9]{1,5})/i);
    if (!match) return;
    const code = utils.formatInviteCode(match[1]);
    const codeInput = document.getElementById('code-join');
    const joinCard = document.querySelector('.card--join');
    if (codeInput) codeInput.value = code;
    if (joinCard) {
      joinCard.classList.add('card--highlighted');
      joinCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();
