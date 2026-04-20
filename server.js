/**
 * Blendr - Serveur principal (securise)
 * Express + Socket.IO
 */

require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// ---------------------------------------------------------------------------
// Mini-logger structure
// ---------------------------------------------------------------------------
const log = {
  info: (...args) => console.log(`[${new Date().toISOString()}] [info]`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] [warn]`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] [error]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [debug]`, ...args);
    }
  },
};

log.info('Demarrage du serveur...');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 500;
const MAX_IMAGE_KB = Number(process.env.MAX_IMAGE_KB) || 500;
const MAX_TEXT_CHARS = Number(process.env.MAX_TEXT_CHARS) || 150;
const MAX_CHAT_CHARS = Number(process.env.MAX_CHAT_CHARS) || 200;
const MAX_STEPS_PER_CHAIN = 20; // Limite memoire : max steps par chaine
const LOBBY_INACTIVITY_MS = 30 * 60 * 1000; // 30 min d'inactivite avant suppression
const PUBLIC_DIR = path.join(__dirname, 'public');

log.info('Configuration:', {
  PORT,
  HOST,
  NODE_ENV,
  CORS_ORIGIN,
  MAX_ROOMS,
  MAX_IMAGE_KB,
  PUBLIC_DIR,
});

// ---------------------------------------------------------------------------
// Express + securite HTTP
// ---------------------------------------------------------------------------
const app = express();

// Trust proxy pour recuperer les vraies IP client (derriere Railway/Render/Fly.io)
app.set('trust proxy', 1);

// Helmet — headers de securite (CSP adaptee a Socket.IO inline)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        fontSrc: ["'self'", 'data:'],
        mediaSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limit global : 200 req / 15 min / IP (genereux pour les assets statiques)
// Note : express-rate-limit gere automatiquement l'IP avec trust proxy
const httpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});
app.use(httpLimiter);

// Healthcheck sans I/O disque
app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.use(express.static(PUBLIC_DIR));

// ---------------------------------------------------------------------------
// Routes HTML
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/join/:code', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/howtoplay', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'howtoplay.html'));
});

app.get('/lobby', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'lobby.html'));
});

app.get('/game', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'game.html'));
});

// ---------------------------------------------------------------------------
// HTTP + Socket.IO
// ---------------------------------------------------------------------------
const server = http.createServer(app);

// CORS : en dev '*', en prod liste explicite (separee par virgules)
const corsOrigin =
  CORS_ORIGIN === '*'
    ? '*'
    : CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

const io = new Server(server, {
  // Max upload par message Socket.IO : ~1 Mo (on valide ensuite 500 Ko max pour les images)
  maxHttpBufferSize: 1 * 1024 * 1024,
  cors: { origin: corsOrigin },
  pingTimeout: 30000,
});

// ---------------------------------------------------------------------------
// Rate limiting avance
// ---------------------------------------------------------------------------
const buckets = new Map();
const connectionLimiter = new Map(); // IP -> { count, firstConn }
const roomCreateByIp = new Map(); // IP -> { count, firstCreate }
const chatBurstBySocket = new Map(); // socket.id -> { count, windowStart }

// Rate limit par socket (token bucket)
function rateLimit_(socket, key, maxTokens, refillMs) {
  const now = Date.now();
  const bucketKey = `${socket.id}:${key}`;
  let bucket = buckets.get(bucketKey) || { tokens: maxTokens, last: now };
  const elapsed = now - bucket.last;
  bucket.tokens = Math.min(
    maxTokens,
    bucket.tokens + (elapsed / refillMs) * maxTokens,
  );
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(bucketKey, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(bucketKey, bucket);
  return true;
}

// Protection burst sur chat : max 3 messages en 2 secondes
function checkChatBurst(socketId) {
  const now = Date.now();
  const windowMs = 2000; // 2 secondes
  const maxBurst = 3;
  
  let record = chatBurstBySocket.get(socketId);
  if (!record || now - record.windowStart > windowMs) {
    // Nouvelle fenetre
    record = { count: 1, windowStart: now };
    chatBurstBySocket.set(socketId, record);
    return { ok: true };
  }
  
  // Meme fenetre
  record.count++;
  if (record.count > maxBurst) {
    return { ok: false, retryAfter: windowMs - (now - record.windowStart) };
  }
  return { ok: true };
}

// Nettoyage periodique des buckets
setInterval(
  () => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (now - b.last > 10 * 60 * 1000) buckets.delete(k);
    }
    // Nettoyage connectionLimiter (IPs inactives depuis 1h)
    for (const [ip, data] of connectionLimiter) {
      if (now - data.firstConn > 60 * 60 * 1000) connectionLimiter.delete(ip);
    }
    // Nettoyage roomCreateByIp (fenetre de 1h)
    for (const [ip, data] of roomCreateByIp) {
      if (now - data.firstCreate > 60 * 60 * 1000) roomCreateByIp.delete(ip);
    }
    // Nettoyage chatBurst (fenetre de 5s)
    for (const [sid, data] of chatBurstBySocket) {
      if (now - data.windowStart > 5000) chatBurstBySocket.delete(sid);
    }
  },
  5 * 60 * 1000,
);

// ---------------------------------------------------------------------------
// Middleware de rate limiting connexions Socket.IO par IP
// ---------------------------------------------------------------------------
io.use((socket, next) => {
  const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || socket.handshake.address;
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxConnectionsPerIp = 10;
  
  let record = connectionLimiter.get(clientIp);
  if (!record) {
    record = { count: 1, firstConn: now };
    connectionLimiter.set(clientIp, record);
  } else {
    // Reset si fenetre expiree
    if (now - record.firstConn > windowMs) {
      record.count = 1;
      record.firstConn = now;
    } else {
      record.count++;
    }
  }
  
  if (record.count > maxConnectionsPerIp) {
    log.warn(`[security] Connexion bloquee pour IP ${clientIp} (trop de connexions)`);
    return next(new Error('RATE_LIMITED'));
  }
  
  // Stocke l'IP pour usage ulterieur
  socket.data.clientIp = clientIp;
  next();
});

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------
function isValidPseudo(pseudo) {
  if (typeof pseudo !== 'string') return false;
  const p = pseudo.trim();
  if (p.length < 2 || p.length > 16) return false;
  return /^[a-zA-Z0-9_-]+$/.test(p);
}

function isValidAvatar(avatar) {
  if (typeof avatar !== 'string') return false;
  // Avatar seed : 1-32 chars, alphanumerique + underscore/hyphen uniquement
  if (avatar.length < 1 || avatar.length > 32) return false;
  return /^[a-zA-Z0-9_-]+$/.test(avatar);
}

function isValidRoomCode(code) {
  if (typeof code !== 'string') return false;
  return /^[A-Z0-9]{5}$/.test(code);
}

function sanitizeText(text, maxLen) {
  if (typeof text !== 'string') return '';
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip control chars
    .slice(0, maxLen)
    .trim();
}

function isValidDrawing(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) return false;
  // Taille max : on estime base64 ~ 1.37x le binaire
  const maxBytes = MAX_IMAGE_KB * 1024;
  const base64Part = dataUrl.split(',')[1] || '';
  const approxBytes = (base64Part.length * 3) / 4;
  return approxBytes <= maxBytes;
}

// ---------------------------------------------------------------------------
// Stockage en memoire des rooms
// ---------------------------------------------------------------------------
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let tries = 0;
  do {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    tries++;
  } while (rooms.has(code) && tries < 50);
  return code;
}

function serializeRoom(room) {
  // Normalise la coherence hostId <-> player.isHost avant de serialiser
  // Cas 1 : hostId ne correspond a aucun joueur => on promeut le premier joueur
  if (room.players.size > 0 && !room.players.has(room.hostId)) {
    const first = [...room.players.values()].find((p) => p.connected) || [...room.players.values()][0];
    if (first) {
      room.hostId = first.id;
      log.warn(`[room] hostId orphelin dans ${room.code}, promotion de ${first.pseudo}`);
    }
  }
  // Cas 2 : s'assure qu'un seul joueur a isHost=true et que c'est bien room.hostId
  for (const p of room.players.values()) {
    p.isHost = (p.id === room.hostId);
  }
  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    settings: room.settings,
    players: [...room.players.values()],
    spectators: [...room.spectators.values()],
    currentTurn: room.currentTurn,
    totalTurns: room.totalTurns,
  };
}

function getPlayersStatus(room) {
  const submissions = room.turnSubmissions || new Map();
  return [...room.players.values()].map((p) => ({
    id: p.id,
    pseudo: p.pseudo,
    avatar: p.avatar,
    done: submissions.has(p.id),
  }));
}

// Mise a jour de l'activite d'une room (pour timeout inactivite)
function touchRoom(room) {
  room.lastActivity = Date.now();
}

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  log.debug(`connexion ${socket.id} (IP: ${socket.data.clientIp})`);

  // -------------------------------------------------------------------------
  // Creation d'une nouvelle room (avec limite par IP)
  // -------------------------------------------------------------------------
  socket.on('room:create', ({ pseudo, avatar } = {}, ack) => {
    // Rate limit par socket
    if (!rateLimit_(socket, 'create', 3, 60000)) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    
    // Limite creation rooms par IP : 5/heure
    const clientIp = socket.data.clientIp;
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000;
    const maxRoomsPerHour = 5;
    
    let ipRecord = roomCreateByIp.get(clientIp);
    if (!ipRecord) {
      ipRecord = { count: 0, firstCreate: now };
    } else if (now - ipRecord.firstCreate > hourWindow) {
      ipRecord = { count: 0, firstCreate: now };
    }
    
    if (ipRecord.count >= maxRoomsPerHour) {
      log.warn(`[security] Room creation bloquee pour IP ${clientIp} (limite 5/heure)`);
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    
    if (!isValidPseudo(pseudo)) {
      return ack?.({ ok: false, error: 'PSEUDO_INVALID' });
    }
    if (!isValidAvatar(avatar)) {
      return ack?.({ ok: false, error: 'AVATAR_INVALID' });
    }
    if (rooms.size >= MAX_ROOMS) {
      return ack?.({ ok: false, error: 'SERVER_FULL' });
    }

    const code = generateRoomCode();
    const room = {
      code,
      hostId: socket.id,
      players: new Map(),
      spectators: new Map(),
      settings: {
        mode: 'classic',
        drawTime: 30,
        describeTime: 20,
        rounds: 'auto',
        voteRoast: true,
        nsfw: false,
        theme: 'free',
      },
      state: 'lobby',
      chains: [],
      createdAt: Date.now(),
      lastActivity: Date.now(), // Pour timeout inactivite
    };
    room.players.set(socket.id, {
      id: socket.id,
      pseudo: pseudo.trim(),
      avatar,
      isHost: true,
      ready: true,
      connected: true,
    });
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;

    // Incremente le compteur de rooms creees pour cette IP
    ipRecord.count++;
    roomCreateByIp.set(clientIp, ipRecord);

    ack?.({ ok: true, code, room: serializeRoom(room) });
    log.info(`[room] creation ${code} par ${pseudo} (IP: ${clientIp})`);
  });

  // -------------------------------------------------------------------------
  // Rejoindre une room existante
  // -------------------------------------------------------------------------
  socket.on('room:join', ({ code, pseudo, avatar, asSpectator } = {}, ack) => {
    if (!rateLimit_(socket, 'join', 10, 60000)) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    code = (code || '').toUpperCase().trim();
    if (!isValidRoomCode(code)) {
      return ack?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    }
    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (!isValidPseudo(pseudo)) {
      return ack?.({ ok: false, error: 'PSEUDO_INVALID' });
    }
    if (!isValidAvatar(avatar)) {
      return ack?.({ ok: false, error: 'AVATAR_INVALID' });
    }
    if (room.state !== 'lobby' && !asSpectator) {
      return ack?.({ ok: false, error: 'GAME_IN_PROGRESS' });
    }
    if (room.players.size >= 12 && !asSpectator) {
      return ack?.({ ok: false, error: 'ROOM_FULL' });
    }
    // Pseudo deja utilise dans la room
    const pseudoTaken = [...room.players.values()].some(
      (p) => p.pseudo === pseudo.trim(),
    );
    if (pseudoTaken) {
      return ack?.({ ok: false, error: 'PSEUDO_TAKEN' });
    }

    if (asSpectator) {
      room.spectators.set(socket.id, { id: socket.id, pseudo: pseudo.trim(), avatar });
    } else {
      room.players.set(socket.id, {
        id: socket.id,
        pseudo: pseudo.trim(),
        avatar,
        isHost: false,
        ready: false,
        connected: true,
      });
    }
    socket.join(code);
    socket.data.roomCode = code;
    touchRoom(room);

    ack?.({ ok: true, code, room: serializeRoom(room) });
    io.to(code).emit('room:update', serializeRoom(room));
    io.to(code).emit('chat:system', {
      message: `${pseudo} a rejoint la partie`,
    });
    log.info(`[room] ${pseudo} rejoint ${code}`);
  });

  // -------------------------------------------------------------------------
  // Rejoindre une room (apres navigation ou refresh)
  // -------------------------------------------------------------------------
  socket.on('room:rejoin', ({ code, pseudo, avatar } = {}, ack) => {
    if (!rateLimit_(socket, 'rejoin', 10, 60000)) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    code = (code || '').toUpperCase().trim();
    if (!isValidRoomCode(code)) {
      return ack?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    }
    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (!isValidPseudo(pseudo)) {
      return ack?.({ ok: false, error: 'PSEUDO_INVALID' });
    }
    if (!isValidAvatar(avatar)) {
      return ack?.({ ok: false, error: 'AVATAR_INVALID' });
    }

    const cleanPseudo = pseudo.trim();

    // Cherche une ancienne entree du joueur par pseudo
    let oldSocketId = null;
    let wasHost = false;
    for (const [sid, p] of room.players) {
      if (p.pseudo === cleanPseudo) {
        oldSocketId = sid;
        wasHost = p.isHost;
        break;
      }
    }

    // Annule un eventuel timer de deconnexion
    if (oldSocketId && room.disconnectTimers?.has(oldSocketId)) {
      clearTimeout(room.disconnectTimers.get(oldSocketId));
      room.disconnectTimers.delete(oldSocketId);
    }

    // Remplace l'ancienne entree par la nouvelle avec le socket actuel
    if (oldSocketId && oldSocketId !== socket.id) {
      room.players.delete(oldSocketId);
      if (room.hostId === oldSocketId) {
        room.hostId = socket.id;
      }
    }

    // Si le host actuel n'existe plus dans les joueurs, transfere a ce joueur
    // (cas ou le host est parti et personne n'a pris le relai)
    if (!room.players.has(room.hostId) && oldSocketId !== socket.id) {
      room.hostId = socket.id;
      wasHost = true;
    }

    // Si la room est vide (seul joueur qui rejoint), il devient hote
    if (room.players.size === 0) {
      room.hostId = socket.id;
      wasHost = true;
    }

    const willBeHost = wasHost || room.hostId === socket.id;
    room.players.set(socket.id, {
      id: socket.id,
      pseudo: cleanPseudo,
      avatar,
      isHost: willBeHost,
      ready: false,
      connected: true,
    });

    // Force la coherence : si ce joueur est host, mettre a jour hostId
    if (willBeHost) {
      room.hostId = socket.id;
    }

    socket.join(code);
    socket.data.roomCode = code;
    touchRoom(room);

    log.info(`[room] rejoin ${code} par ${cleanPseudo} - isHost: ${willBeHost}, hostId: ${room.hostId}`);

    ack?.({ ok: true, code, room: serializeRoom(room) });
    io.to(code).emit('room:update', serializeRoom(room));

    // Si partie en cours, renvoyer l'etat du tour courant a ce joueur
    if (room.state === 'playing' && room.currentTurnData) {
      const personalTurn = buildTurnDataForPlayer(room, socket.id);
      if (personalTurn) {
        socket.emit('turn:start', personalTurn);
      }
      // Etat des autres joueurs
      socket.emit('players:status', { players: getPlayersStatus(room) });
    }

    log.info(`[room] rejoin ${code} par ${cleanPseudo}`);
  });

  // -------------------------------------------------------------------------
  // Chat du lobby / partie (avec protection burst)
  // -------------------------------------------------------------------------
  socket.on('chat:message', ({ message } = {}, ack) => {
    if (!rateLimit_(socket, 'chat', 5, 10000)) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    
    // Protection burst : max 3 messages en 2 secondes
    const burstCheck = checkChatBurst(socket.id);
    if (!burstCheck.ok) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    
    const code = socket.data.roomCode;
    if (!code) return ack?.({ ok: false, error: 'NOT_IN_ROOM' });
    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    const player =
      room.players.get(socket.id) || room.spectators.get(socket.id);
    if (!player) return ack?.({ ok: false, error: 'NOT_IN_ROOM' });

    const clean = sanitizeText(message, MAX_CHAT_CHARS);
    if (!clean) return ack?.({ ok: false, error: 'EMPTY_MESSAGE' });

    io.to(code).emit('chat:message', {
      pseudo: player.pseudo,
      avatar: player.avatar,
      message: clean,
      ts: Date.now(),
    });
    ack?.({ ok: true });
    touchRoom(room);
  });

  // -------------------------------------------------------------------------
  // Toggle ready
  // -------------------------------------------------------------------------
  socket.on('lobby:ready', ({ ready } = {}) => {
    if (!rateLimit_(socket, 'ready', 10, 10000)) return;
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.ready = !!ready;
    touchRoom(room);
    io.to(room.code).emit('room:update', serializeRoom(room));
  });

  // -------------------------------------------------------------------------
  // Mise a jour des settings (host uniquement)
  // -------------------------------------------------------------------------
  socket.on('lobby:settings', (settings = {}) => {
    if (!rateLimit_(socket, 'settings', 20, 60000)) return;
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.state !== 'lobby') return;

    // Whitelist des cles autorisees + validation
    const allowed = {};
    if (['classic', 'audio', 'sabotage'].includes(settings.mode))
      allowed.mode = settings.mode;
    if ([15, 30, 60, 90].includes(Number(settings.drawTime)))
      allowed.drawTime = Number(settings.drawTime);
    if ([10, 20, 30].includes(Number(settings.describeTime)))
      allowed.describeTime = Number(settings.describeTime);
    if (settings.rounds === 'auto' || (Number(settings.rounds) >= 3 && Number(settings.rounds) <= 20))
      allowed.rounds = settings.rounds === 'auto' ? 'auto' : Number(settings.rounds);
    if (typeof settings.voteRoast === 'boolean') allowed.voteRoast = settings.voteRoast;
    if (typeof settings.nsfw === 'boolean') allowed.nsfw = settings.nsfw;

    room.settings = { ...room.settings, ...allowed };
    touchRoom(room);
    io.to(room.code).emit('room:update', serializeRoom(room));
  });

  // -------------------------------------------------------------------------
  // Lancer la partie (host uniquement)
  // -------------------------------------------------------------------------
  socket.on('lobby:start', () => {
    if (!rateLimit_(socket, 'start', 3, 10000)) return;
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.size < 3) return;
    if (room.state !== 'lobby') return;

    let count = 3;
    io.to(room.code).emit('game:countdown', { count });

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        io.to(room.code).emit('game:countdown', { count });
      } else {
        clearInterval(interval);
        io.to(room.code).emit('game:countdown', { count: 'GO' });
        setTimeout(() => {
          room.state = 'playing';
          initializeGame(room);
          io.to(room.code).emit('game:start', {});
          log.info(`[game] demarrage ${room.code}`);
        }, 1000);
      }
    }, 1000);
  });

  // -------------------------------------------------------------------------
  // Soumission d'un tour
  // -------------------------------------------------------------------------
  socket.on('turn:submit', ({ type, content } = {}, ack) => {
    if (!rateLimit_(socket, 'submit', 3, 5000)) {
      return ack?.({ ok: false, error: 'RATE_LIMITED' });
    }
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.state !== 'playing') {
      return ack?.({ ok: false, error: 'NOT_PLAYING' });
    }
    const player = room.players.get(socket.id);
    if (!player) return ack?.({ ok: false, error: 'NOT_IN_ROOM' });

    // Validation du type
    if (type !== 'text' && type !== 'drawing') {
      return ack?.({ ok: false, error: 'INVALID_TYPE' });
    }

    let validContent;
    if (type === 'text') {
      validContent = sanitizeText(content, MAX_TEXT_CHARS);
      if (!validContent) validContent = '[Pas de reponse]';
    } else {
      if (!isValidDrawing(content)) {
        return ack?.({ ok: false, error: 'INVALID_IMAGE' });
      }
      validContent = content;
    }

    // Pas de doublon
    if (!room.turnSubmissions) room.turnSubmissions = new Map();
    if (room.turnSubmissions.has(socket.id)) {
      return ack?.({ ok: false, error: 'ALREADY_SUBMITTED' });
    }

    room.turnSubmissions.set(socket.id, { type, content: validContent });

    log.debug(
      `[turn] ${player.pseudo} a soumis (${type}) - ${room.turnSubmissions.size}/${room.players.size}`,
    );

    ack?.({ ok: true });

    io.to(room.code).emit('players:status', {
      players: getPlayersStatus(room),
    });

    if (room.turnSubmissions.size === room.players.size) {
      processTurnEnd(room);
    }
  });

  // -------------------------------------------------------------------------
  // Deconnexion
  // -------------------------------------------------------------------------
  socket.on('disconnect', () => {
    log.debug(`deconnexion ${socket.id}`);
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    const spectator = room.spectators.get(socket.id);

    if (spectator) {
      room.spectators.delete(socket.id);
    } else if (player) {
      if (room.state === 'lobby') {
        room.players.delete(socket.id);
        io.to(code).emit('chat:system', {
          message: `${player.pseudo} a quitte la partie`,
        });
      } else {
        // En jeu : marque comme deconnecte, et planifie une suppression dans 60s
        player.connected = false;
        if (!room.disconnectTimers) room.disconnectTimers = new Map();
        const timer = setTimeout(() => {
          const r = rooms.get(code);
          if (!r) return;
          const p = r.players.get(socket.id);
          if (p && !p.connected) {
            r.players.delete(socket.id);
            log.info(`[room] ${player.pseudo} supprime apres 60s hors-ligne`);
            // Si le host est parti, transfert
            maybeTransferHost(r, socket.id);
            // Si plus assez de joueurs en jeu, termine la partie
            if (r.state === 'playing' && r.players.size < 2) {
              forceEndGame(r);
            }
            io.to(code).emit('room:update', serializeRoom(r));
          }
          r.disconnectTimers?.delete(socket.id);
        }, 60 * 1000);
        room.disconnectTimers.set(socket.id, timer);
      }

      // Transfert de host immediat
      maybeTransferHost(room, socket.id);
    }

    if (room.players.size === 0 && room.spectators.size === 0) {
      setTimeout(() => {
        const stillEmpty =
          rooms.get(code)?.players.size === 0 &&
          rooms.get(code)?.spectators.size === 0;
        if (stillEmpty) {
          rooms.delete(code);
          log.info(`[room] suppression ${code} (vide)`);
        }
      }, 2 * 60 * 1000);
    } else {
      io.to(code).emit('room:update', serializeRoom(room));
    }

    // Nettoyage buckets de rate limit
    for (const k of buckets.keys()) {
      if (k.startsWith(socket.id + ':')) buckets.delete(k);
    }
    // Nettoyage chat burst
    chatBurstBySocket.delete(socket.id);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function maybeTransferHost(room, oldSocketId) {
  if (room.hostId !== oldSocketId) return;
  if (room.players.size === 0) return;
  const next = [...room.players.values()].find((p) => p.connected);
  if (next) {
    room.hostId = next.id;
    next.isHost = true;
    io.to(room.code).emit('chat:system', {
      message: `${next.pseudo} est maintenant l'hote`,
    });
    io.to(room.code).emit('room:update', serializeRoom(room));
  }
}

function forceEndGame(room) {
  log.warn(`[game] fin forcee de ${room.code} (pas assez de joueurs)`);
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  endGame(room);
}

// ---------------------------------------------------------------------------
// Logique de jeu
// ---------------------------------------------------------------------------
function initializeGame(room) {
  const playerIds = [...room.players.keys()];
  const numPlayers = playerIds.length;

  // Limite memoire : max 20 steps par chaine (limite raisonnable)
  const maxSteps = Math.min(numPlayers, MAX_STEPS_PER_CHAIN);

  room.chains = playerIds.map((playerId) => ({
    initiator: playerId,
    steps: [],
  }));

  room.currentTurn = 0;
  room.totalTurns = maxSteps;
  room.turnSubmissions = new Map();
  room.playerOrder = playerIds; // Fige l'ordre pour la rotation

  startTurn(room, 0);
}

function buildTurnDataForPlayer(room, playerId) {
  if (!room.playerOrder) return null;
  const turnIndex = room.currentTurn;
  const playerIndex = room.playerOrder.indexOf(playerId);
  if (playerIndex === -1) return null;

  const isFirstTurn = turnIndex === 0;
  const isDrawTurn = !isFirstTurn && turnIndex % 2 === 1;
  const duration = isDrawTurn
    ? room.settings.drawTime
    : room.settings.describeTime;

  const chainIndex = isFirstTurn
    ? playerIndex
    : (playerIndex - turnIndex + room.playerOrder.length) %
      room.playerOrder.length;

  const chain = room.chains[chainIndex];
  const lastStep = chain.steps[chain.steps.length - 1];

  const data = {
    turnNumber: turnIndex + 1,
    totalTurns: room.totalTurns,
    duration,
  };

  if (isFirstTurn) {
    data.type = 'write';
    data.prompt = 'Ecris une phrase que les autres devront dessiner !';
  } else if (isDrawTurn) {
    data.type = 'draw';
    data.prompt = lastStep?.content || '[Pas de phrase]';
  } else {
    data.type = 'write';
    data.prompt = 'Decris ce dessin en une phrase...';
    data.imageData = lastStep?.content || '';
  }

  return data;
}

function startTurn(room, turnIndex) {
  room.currentTurn = turnIndex;
  room.turnSubmissions = new Map();
  room.currentTurnData = true;

  const playerIds = room.playerOrder || [...room.players.keys()];
  const isDrawTurn = turnIndex > 0 && turnIndex % 2 === 1;
  const duration = isDrawTurn
    ? room.settings.drawTime
    : room.settings.describeTime;

  playerIds.forEach((playerId) => {
    const turnData = buildTurnDataForPlayer(room, playerId);
    if (turnData) {
      io.to(playerId).emit('turn:start', turnData);
    }
  });

  room.turnTimer = setTimeout(
    () => {
      processTurnEnd(room);
    },
    (duration + 2) * 1000,
  );
}

function processTurnEnd(room) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  const playerIds = room.playerOrder || [...room.players.keys()];
  const turnIndex = room.currentTurn;

  playerIds.forEach((playerId, playerIndex) => {
    const chainIndex =
      turnIndex === 0
        ? playerIndex
        : (playerIndex - turnIndex + playerIds.length) % playerIds.length;

    const chain = room.chains[chainIndex];
    
    // Protection memoire : limite le nombre de steps
    if (chain.steps.length >= MAX_STEPS_PER_CHAIN) {
      log.warn(`[security] Chain ${chainIndex} atteint la limite de ${MAX_STEPS_PER_CHAIN} steps`);
      return;
    }
    
    const submission = room.turnSubmissions.get(playerId);

    if (submission) {
      chain.steps.push({
        playerId,
        type: submission.type,
        content: submission.content,
        turnIndex,
      });
    } else {
      chain.steps.push({
        playerId,
        type: turnIndex % 2 === 0 ? 'text' : 'drawing',
        content: turnIndex % 2 === 0 ? '[Pas de reponse]' : '',
        turnIndex,
      });
    }
  });

  room.turnSubmissions = new Map();

  if (room.currentTurn + 1 < room.totalTurns) {
    setTimeout(() => {
      startTurn(room, room.currentTurn + 1);
    }, 2000);
  } else {
    endGame(room);
  }
}

function endGame(room) {
  room.state = 'reveal';
  room.currentTurnData = null;
  log.info(`[game] fin de la partie ${room.code}`);

  const chains = room.chains.map((chain) => {
    const initiator = room.players.get(chain.initiator);
    return {
      initiatorPseudo: initiator?.pseudo || 'Inconnu',
      initiatorAvatar: initiator?.avatar || '',
      steps: chain.steps.map((step) => {
        const p = room.players.get(step.playerId);
        return {
          pseudo: p?.pseudo || 'Inconnu',
          avatar: p?.avatar || '',
          type: step.type,
          content: step.content,
        };
      }),
    };
  });

  io.to(room.code).emit('game:end', { chains });
}

// ---------------------------------------------------------------------------
// Nettoyage periodique des rooms (avec timeout inactivite)
// ---------------------------------------------------------------------------
setInterval(
  () => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const allDisconnected =
        room.players.size > 0 &&
        [...room.players.values()].every((p) => !p.connected) &&
        room.spectators.size === 0;
      const olderThanHour = now - room.createdAt > 60 * 60 * 1000;
      const lobbyInactive = room.state === 'lobby' && 
        room.lastActivity && 
        (now - room.lastActivity) > LOBBY_INACTIVITY_MS;
      
      if (allDisconnected || olderThanHour || room.players.size === 0 || lobbyInactive) {
        // cleanup timers
        if (room.turnTimer) clearTimeout(room.turnTimer);
        if (room.disconnectTimers) {
          for (const t of room.disconnectTimers.values()) clearTimeout(t);
        }
        rooms.delete(code);
        const reason = lobbyInactive ? 'inactivite lobby' : (allDisconnected ? 'tous deconnectes' : 'vieille room');
        log.info(`[cleanup] suppression ${code} (${reason})`);
      }
    }
  },
  5 * 60 * 1000,
);

// ---------------------------------------------------------------------------
// Demarrage
// ---------------------------------------------------------------------------
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log.error(
      `Le port ${PORT} est deja utilise. Arrete l'autre terminal ou lance : PORT=3001 npm start`,
    );
    process.exit(1);
  }
  log.error('Erreur serveur :', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : PORT;
  const hostLabel = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
  log.info('Blendr — serveur HTTP pret');
  log.info(`  → http://${hostLabel}:${port}/`);
  log.info(`  → http://localhost:${port}/`);
  log.info(`  → health : curl http://${hostLabel}:${port}/health`);
});

// Graceful shutdown
function shutdown(signal) {
  log.info(`${signal} recu, arret en cours...`);
  io.close(() => {
    server.close(() => {
      log.info('Serveur arrete proprement');
      process.exit(0);
    });
  });
  // Timeout de securite
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
