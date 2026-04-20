/**
 * Blendr — Logique de jeu
 */

(function () {
  const { utils, avatars, sounds, CanvasDrawing, CANVAS_COLORS } = window.Blendr;

  let socket = null;
  let currentTurn = null;
  let canvasDrawing = null;
  let timerInterval = null;
  let timerEnd = null;

  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('code');

  if (!roomCode) {
    utils.toast('Code de room manquant', 'error');
    setTimeout(() => (window.location.href = '/'), 1500);
    return;
  }

  function connectSocket() {
    if (socket && socket.connected) return;
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('[socket] Connecté', socket.id);

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
            utils.toast(utils.errorMessage(res?.error), 'error');
            setTimeout(() => (window.location.href = '/'), 1500);
            return;
          }
          console.log('[game] rejoin OK', res.code);
        }
      );
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Déconnecté', reason);
      utils.toast('Connexion perdue', 'error');
    });

    socket.on('turn:start', (data) => {
      console.log('[turn:start]', data);
      currentTurn = data;
      startTurn(data);
    });

    socket.on('turn:end', () => {
      console.log('[turn:end]');
      showWaitingScreen();
    });

    socket.on('players:status', (data) => {
      updateWaitingPlayers(data.players);
    });

    socket.on('game:end', (data) => {
      console.log('[game:end]', data);
      showGameEnd(data.chains);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    connectSocket();
    setupUI();
  });

  function setupUI() {
    const palette = document.getElementById('color-palette');
    CANVAS_COLORS.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.className = 'tool-color';
      if (i === 0) btn.classList.add('tool-color--active');
      btn.style.background = color;
      btn.dataset.color = color;
      btn.title = color;
      btn.addEventListener('click', () => selectColor(color));
      palette.appendChild(btn);
    });

    document.querySelectorAll('.tool-size').forEach((btn) => {
      btn.addEventListener('click', () => {
        const size = Number(btn.dataset.size);
        selectSize(size);
      });
    });

    document.getElementById('tool-eraser').addEventListener('click', () => {
      if (canvasDrawing) canvasDrawing.setTool('eraser');
    });

    document.getElementById('tool-undo').addEventListener('click', () => {
      if (canvasDrawing) canvasDrawing.undo();
    });

    document.getElementById('tool-clear').addEventListener('click', () => {
      if (confirm('Tout effacer ? Cette action est irréversible.')) {
        if (canvasDrawing) canvasDrawing.clear();
      }
    });

    document.getElementById('btn-submit-write').addEventListener('click', submitWrite);
    document.getElementById('btn-submit-draw').addEventListener('click', submitDraw);

    const writeInput = document.getElementById('write-input');
    const writeCounter = document.getElementById('write-counter');
    writeInput.addEventListener('input', () => {
      writeCounter.textContent = writeInput.value.length;
    });
  }

  function startTurn(data) {
    currentTurn = data;
    stopTimer();

    const { type, prompt, imageData, duration, turnNumber, totalTurns } = data;

    showTimer(duration, turnNumber, totalTurns);

    if (type === 'write') {
      showWriteScreen(prompt, imageData);
    } else if (type === 'draw') {
      showDrawScreen(prompt);
    }

    sounds?.ding();
  }

  function showWriteScreen(prompt, imageData) {
    hideAllScreens();
    const screen = document.getElementById('screen-write');
    screen.classList.add('game__screen--active');

    const promptEl = document.getElementById('write-prompt');
    const contextEl = document.getElementById('write-context');
    const inputEl = document.getElementById('write-input');

    inputEl.value = '';
    document.getElementById('write-counter').textContent = '0';

    if (imageData) {
      promptEl.textContent = 'Décris ce dessin en une phrase...';
      contextEl.innerHTML = `<img src="${imageData}" class="write-screen__image" alt="Dessin à décrire" />`;
    } else {
      promptEl.textContent = prompt || 'Écris une phrase que les autres devront dessiner !';
      contextEl.innerHTML = '';
    }

    inputEl.focus();
  }

  function showDrawScreen(prompt) {
    hideAllScreens();
    const screen = document.getElementById('screen-draw');
    screen.classList.add('game__screen--active');

    const promptEl = document.getElementById('draw-prompt');
    promptEl.textContent = prompt || 'Dessine cette phrase !';

    if (!canvasDrawing) {
      canvasDrawing = new CanvasDrawing('draw-canvas');
    } else {
      canvasDrawing.clear();
    }
  }

  function showWaitingScreen() {
    hideAllScreens();
    document.getElementById('screen-waiting').classList.add('game__screen--active');
    hideTimer();
  }

  function hideAllScreens() {
    document.querySelectorAll('.game__screen').forEach((s) => {
      s.classList.remove('game__screen--active');
    });
  }

  function showTimer(duration, turnNumber, totalTurns) {
    const timerEl = document.getElementById('timer');
    const labelEl = document.getElementById('timer-label');
    const fillEl = document.getElementById('timer-fill');
    const timeEl = document.getElementById('timer-time');

    timerEl.style.display = 'flex';
    labelEl.textContent = `Tour ${turnNumber}/${totalTurns}`;

    timerEnd = Date.now() + duration * 1000;

    timerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      timeEl.textContent = remaining;

      const percent = (remaining / duration) * 100;
      fillEl.style.width = `${percent}%`;

      if (remaining <= 5) {
        fillEl.classList.add('timer__fill--warning');
        if (remaining > 0 && remaining <= 5) {
          sounds?.tick();
        }
      } else {
        fillEl.classList.remove('timer__fill--warning');
      }

      if (remaining === 0) {
        stopTimer();
        autoSubmit();
      }
    }, 100);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function hideTimer() {
    document.getElementById('timer').style.display = 'none';
    stopTimer();
  }

  function submitWrite() {
    const input = document.getElementById('write-input');
    const text = input.value.trim();

    if (!text) {
      utils.toast('Écris quelque chose !', 'error');
      utils.shake(input);
      return;
    }

    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length < 3) {
      utils.toast('Au moins 3 mots requis', 'error');
      utils.shake(input);
      return;
    }

    socket.emit('turn:submit', { type: 'text', content: text }, handleSubmitAck);
    sounds?.swoosh();
    showWaitingScreen();
  }

  function submitDraw() {
    if (!canvasDrawing) return;

    if (canvasDrawing.isEmpty()) {
      utils.toast('Tu dois dessiner quelque chose !', 'error');
      return;
    }

    const imageData = canvasDrawing.toJPEG();
    socket.emit(
      'turn:submit',
      { type: 'drawing', content: imageData },
      handleSubmitAck,
    );
    sounds?.swoosh();
    showWaitingScreen();
  }

  function handleSubmitAck(res) {
    if (res && !res.ok && res.error !== 'ALREADY_SUBMITTED') {
      utils.toast(utils.errorMessage(res.error), 'error');
    }
  }

  function autoSubmit() {
    if (!currentTurn) return;

    if (currentTurn.type === 'write') {
      const text = document.getElementById('write-input').value.trim();
      socket.emit(
        'turn:submit',
        {
          type: 'text',
          content: text || '[Pas de réponse]',
        },
        handleSubmitAck,
      );
    } else if (currentTurn.type === 'draw') {
      const imageData = canvasDrawing?.toJPEG() || '';
      if (imageData) {
        socket.emit(
          'turn:submit',
          { type: 'drawing', content: imageData },
          handleSubmitAck,
        );
      } else {
        socket.emit(
          'turn:submit',
          { type: 'text', content: '[Pas de réponse]' },
          handleSubmitAck,
        );
      }
    }

    showWaitingScreen();
  }

  function selectColor(color) {
    if (!canvasDrawing) return;
    canvasDrawing.setColor(color);

    document.querySelectorAll('.tool-color').forEach((btn) => {
      btn.classList.toggle('tool-color--active', btn.dataset.color === color);
    });
  }

  function selectSize(size) {
    if (!canvasDrawing) return;
    canvasDrawing.setSize(size);

    document.querySelectorAll('.tool-size').forEach((btn) => {
      btn.classList.toggle('tool-size--active', Number(btn.dataset.size) === size);
    });
  }

  function updateWaitingPlayers(players) {
    const container = document.getElementById('waiting-players');
    if (!container) return;

    container.innerHTML = '';
    players.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'waiting-player';

      const avatar = document.createElement('div');
      avatar.className = 'waiting-player__avatar';
      avatars.render(avatar, p.avatar);

      const name = document.createElement('div');
      name.className = 'waiting-player__name';
      name.textContent = p.pseudo;

      const status = document.createElement('div');
      status.className = 'waiting-player__status';
      status.textContent = p.done ? '✓' : '⏳';

      div.appendChild(avatar);
      div.appendChild(name);
      div.appendChild(status);
      container.appendChild(div);
    });
  }

  // -------------------------------------------------------------------
  // Fin de partie — Révélation simple
  // -------------------------------------------------------------------
  function showGameEnd(chains) {
    hideTimer();
    hideAllScreens();

    const content = document.querySelector('.game__content');
    content.innerHTML = `
      <div class="reveal">
        <h2 class="reveal__title">🎉 Fin de la partie !</h2>
        <p class="reveal__subtitle">Voici comment vos chaînes se sont déformées...</p>
        <div class="reveal__chains" id="reveal-chains"></div>
        <div class="game__actions" style="margin-top: 40px">
          <a href="/" class="btn btn--primary">Retour à l'accueil</a>
        </div>
      </div>
    `;

    const container = document.getElementById('reveal-chains');
    chains.forEach((chain, idx) => {
      const chainEl = document.createElement('div');
      chainEl.className = 'reveal-chain';
      chainEl.innerHTML = `
        <h3 class="reveal-chain__title">Chaîne de ${escapeHtml(chain.initiatorPseudo)}</h3>
        <div class="reveal-chain__steps" id="chain-${idx}"></div>
      `;
      container.appendChild(chainEl);

      const stepsEl = chainEl.querySelector(`#chain-${idx}`);
      chain.steps.forEach((step) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'reveal-step';

        if (step.type === 'text') {
          stepEl.innerHTML = `
            <div class="reveal-step__author">${escapeHtml(step.pseudo)} a écrit :</div>
            <div class="reveal-step__text">"${escapeHtml(step.content)}"</div>
          `;
        } else if (step.type === 'drawing') {
          stepEl.innerHTML = `
            <div class="reveal-step__author">${escapeHtml(step.pseudo)} a dessiné :</div>
            <img src="${step.content}" class="reveal-step__img" alt="Dessin" />
          `;
        }

        stepsEl.appendChild(stepEl);
      });
    });

    sounds?.ding();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
})();
