/**
 * Blendr — Logique du lobby (salle d'attente)
 *
 * - Connexion Socket.IO
 * - Affichage des joueurs en temps réel
 * - Chat
 * - Configuration (host uniquement)
 * - Bouton "Lancer la partie"
 */

(function () {
  const { utils, avatars } = window.Blendr;

  let socket = null;
  let roomData = null;
  let mySocketId = null;

  // Récupération du code depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('code');

  if (!roomCode || roomCode.length !== 5) {
    utils.toast('Code de room invalide', 'error');
    setTimeout(() => (window.location.href = '/'), 1500);
    return;
  }

  // -------------------------------------------------------------------
  // Socket.IO
  // -------------------------------------------------------------------
  function connectSocket() {
    if (socket && socket.connected) return;
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('[socket] Connecté', socket.id);
      // Important : synchronise mySocketId immédiatement
      mySocketId = socket.id;

      // Rejoindre la room avec les infos stockées localement
      const pseudo = utils.storage.get('blendr.pseudo');
      const avatar = utils.storage.get('blendr.avatarSeed');
      if (!pseudo || !avatar) {
        utils.toast('Profil manquant, retour à l\'accueil', 'error');
        setTimeout(() => (window.location.href = '/'), 1500);
        return;
      }

      socket.emit(
        'room:rejoin',
        { code: roomCode, pseudo, avatar },
        (res) => {
          if (!res || !res.ok) {
            const errMsg = utils.errorMessage(res?.error);
            utils.toast(errMsg, 'error');
            setTimeout(() => (window.location.href = '/'), 1500);
            return;
          }
          // Met à jour mySocketId au cas où il aurait changé pendant l'appel
          mySocketId = socket.id;
          roomData = res.room;
          // Force un re-render pour mettre à jour l'UI hôte/joueur
          renderRoom();
          console.log('[lobby] rejoin OK', res.code, 'hostId:', roomData?.hostId, 'myId:', mySocketId);
        }
      );
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Déconnecté', reason);
      if (reason === 'io server disconnect') {
        utils.toast('Déconnecté du serveur', 'error');
        setTimeout(() => (window.location.href = '/'), 2000);
      }
    });

    socket.on('room:update', (data) => {
      console.log('[room:update]', data);
      roomData = data;
      // Synchronise mySocketId au cas où le socket se reconnecte
      if (socket.id) {
        mySocketId = socket.id;
      }
      renderRoom();
    });

    socket.on('chat:message', (msg) => {
      addChatMessage(msg);
    });

    socket.on('chat:system', (msg) => {
      addSystemMessage(msg.message);
      // Son "pop" si quelqu'un rejoint
      if (
        msg.message.includes('rejoint') ||
        msg.message.includes('joined')
      ) {
        window.Blendr.sounds?.pop();
      }
    });

    socket.on('game:countdown', (data) => {
      showCountdown(data.count);
    });

    socket.on('game:start', (data) => {
      console.log('[game:start]', data);
      utils.toast('La partie commence !', 'success');
      setTimeout(() => {
        window.location.href = `/game?code=${roomCode}`;
      }, 500);
    });
  }

  // -------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    connectSocket();
    setupUI();
  });

  function setupUI() {
    document.getElementById('room-code').textContent = roomCode;

    document.getElementById('btn-copy-code').addEventListener('click', () => {
      copyToClipboard(roomCode);
      utils.toast('Code copié !', 'success');
    });

    document
      .getElementById('btn-copy-link')
      .addEventListener('click', () => {
        const link = `${window.location.origin}/join/${roomCode}`;
        copyToClipboard(link);
        utils.toast('Lien copié !', 'success');
      });

    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');

    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      socket.emit('chat:message', { message: text }, (res) => {
        if (res && !res.ok) {
          utils.toast(utils.errorMessage(res.error), 'error');
          chatInput.value = text;
        }
      });
      chatInput.value = '';
    }

    btnSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      socket.emit('lobby:start');
    });
  }

  // -------------------------------------------------------------------
  // Rendu de la room
  // -------------------------------------------------------------------
  function renderRoom() {
    if (!roomData) return;

    // Détection robuste de l'hôte : on cherche NOTRE joueur par socket.id,
    // avec fallback par pseudo si le socket.id a changé (reconnexion)
    const currentSocketId = socket?.id || mySocketId;
    const myPseudo = utils.storage.get('blendr.pseudo');
    const players = roomData.players || [];
    const myPlayer =
      players.find((p) => p.id === currentSocketId) ||
      players.find((p) => p.pseudo === myPseudo);
    const isHost =
      (myPlayer?.isHost === true) ||
      (roomData.hostId === currentSocketId) ||
      (roomData.hostId === myPlayer?.id);
    const settings = roomData.settings || {};

    console.log('[renderRoom] isHost:', isHost, 'myId:', currentSocketId, 'hostId:', roomData.hostId, 'myPlayer:', myPlayer?.pseudo, 'myPseudo:', myPseudo);

    // Compteur de joueurs
    document.getElementById('player-count').textContent = players.length;

    // Liste des joueurs
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    players.forEach((player) => {
      const card = document.createElement('div');
      card.className = 'player-card';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'player-card__avatar';
      avatars.render(avatarDiv, player.avatar);

      const info = document.createElement('div');
      info.className = 'player-card__info';

      const pseudo = document.createElement('p');
      pseudo.className = 'player-card__pseudo';
      pseudo.textContent = player.pseudo;

      if (player.isHost) {
        const badge = document.createElement('span');
        badge.className = 'player-card__badge';
        badge.textContent = 'HOST';
        pseudo.appendChild(badge);
      }

      info.appendChild(pseudo);

      const ready = document.createElement('div');
      ready.className = 'player-card__ready';
      if (player.ready) ready.classList.add('player-card__ready--yes');

      card.appendChild(avatarDiv);
      card.appendChild(info);
      card.appendChild(ready);
      playersList.appendChild(card);
    });

    // Bouton "Lancer la partie"
    const btnStart = document.getElementById('btn-start');
    const startHint = document.getElementById('start-hint');

    if (isHost) {
      if (players.length >= 3) {
        btnStart.disabled = false;
        btnStart.classList.add('anim-pulse');
        startHint.textContent = 'Prêt à lancer !';
        startHint.style.color = 'var(--color-success)';
      } else {
        btnStart.disabled = true;
        btnStart.classList.remove('anim-pulse');
        startHint.textContent = 'Minimum 3 joueurs pour lancer';
        startHint.style.color = 'var(--color-text-muted)';
      }
      btnStart.style.display = 'inline-flex';
    } else {
      btnStart.style.display = 'none';
      startHint.textContent = "L'hôte lancera la partie";
    }

    // Panneau de configuration (host uniquement)
    const settingsPanel = document.getElementById('settings-panel');
    if (isHost) {
      settingsPanel.style.display = 'block';
      renderSettings(settings);
    } else {
      settingsPanel.style.display = 'none';
    }
  }

  // -------------------------------------------------------------------
  // Rendu des paramètres (host)
  // -------------------------------------------------------------------
  function renderSettings(settings) {
    const form = document.getElementById('settings-form');
    form.innerHTML = `
      <div class="setting">
        <div class="setting__label">Mode de jeu</div>
        <div class="setting__options">
          <button class="setting__option ${settings.mode === 'classic' ? 'setting__option--selected' : ''}" data-setting="mode" data-value="classic">
            Classique
          </button>
          <button class="setting__option ${settings.mode === 'audio' ? 'setting__option--selected' : ''}" data-setting="mode" data-value="audio">
            Audio
          </button>
          <button class="setting__option ${settings.mode === 'sabotage' ? 'setting__option--selected' : ''}" data-setting="mode" data-value="sabotage">
            Sabotage
          </button>
        </div>
      </div>

      <div class="setting">
        <div class="setting__label">Temps de dessin</div>
        <div class="setting__options">
          <button class="setting__option ${settings.drawTime === 15 ? 'setting__option--selected' : ''}" data-setting="drawTime" data-value="15">
            15s
          </button>
          <button class="setting__option ${settings.drawTime === 30 ? 'setting__option--selected' : ''}" data-setting="drawTime" data-value="30">
            30s
          </button>
          <button class="setting__option ${settings.drawTime === 60 ? 'setting__option--selected' : ''}" data-setting="drawTime" data-value="60">
            60s
          </button>
          <button class="setting__option ${settings.drawTime === 90 ? 'setting__option--selected' : ''}" data-setting="drawTime" data-value="90">
            90s
          </button>
        </div>
      </div>

      <div class="setting">
        <div class="setting__label">Temps de description</div>
        <div class="setting__options">
          <button class="setting__option ${settings.describeTime === 10 ? 'setting__option--selected' : ''}" data-setting="describeTime" data-value="10">
            10s
          </button>
          <button class="setting__option ${settings.describeTime === 20 ? 'setting__option--selected' : ''}" data-setting="describeTime" data-value="20">
            20s
          </button>
          <button class="setting__option ${settings.describeTime === 30 ? 'setting__option--selected' : ''}" data-setting="describeTime" data-value="30">
            30s
          </button>
        </div>
      </div>

      <div class="setting">
        <div class="setting__label">Vote & Roast</div>
        <div class="setting__options">
          <button class="setting__option ${settings.voteRoast ? 'setting__option--selected' : ''}" data-setting="voteRoast" data-value="true">
            Activé
          </button>
          <button class="setting__option ${!settings.voteRoast ? 'setting__option--selected' : ''}" data-setting="voteRoast" data-value="false">
            Désactivé
          </button>
        </div>
      </div>
    `;

    form.querySelectorAll('.setting__option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.setting;
        let value = btn.dataset.value;

        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = Number(value);

        socket.emit('lobby:settings', { [key]: value });
      });
    });
  }

  // -------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------
  function addChatMessage({ pseudo, message, ts }) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `<span class="chat-msg__author">${escapeHtml(pseudo)}:</span> <span class="chat-msg__text">${escapeHtml(message)}</span>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function addSystemMessage(text) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--system';
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // -------------------------------------------------------------------
  // Countdown
  // -------------------------------------------------------------------
  function showCountdown(count) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fade-in 0.2s ease-out;
    `;

    const text = document.createElement('div');
    text.style.cssText = `
      font-size: clamp(4rem, 20vw, 10rem);
      font-weight: 900;
      color: ${count === 'GO' ? '#4ade80' : '#6c63ff'};
      animation: countdown-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    `;
    text.textContent = count;

    overlay.appendChild(text);
    document.body.appendChild(overlay);

    if (count === 'GO') {
      window.Blendr.sounds?.countdownGo();
    } else {
      window.Blendr.sounds?.countdown();
    }

    setTimeout(() => {
      overlay.remove();
    }, count === 'GO' ? 1200 : 900);
  }
})();
