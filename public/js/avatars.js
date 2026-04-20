/**
 * Blendr — Générateur d'avatars SVG
 *
 * Un avatar est une combinaison déterministe (via "seed") de :
 *  - une forme de visage
 *  - une couleur de fond
 *  - des yeux
 *  - une bouche
 *  - un accessoire (optionnel)
 *
 * L'avatar est rendu en SVG dans le navigateur et est identifié
 * uniquement par son seed pour que tous les joueurs voient le même rendu.
 */

window.Blendr = window.Blendr || {};

(function () {
  // ------------------------------------------------------------------
  // Palettes & styles
  // ------------------------------------------------------------------
  const BG_COLORS = [
    '#6C63FF', // violet
    '#FF6B6B', // corail
    '#FFD93D', // jaune
    '#4ADE80', // vert vif
    '#00BFFF', // bleu ciel
    '#FF69B4', // rose
    '#FFA500', // orange
    '#9F7AEA', // lavande
    '#38B2AC', // turquoise
    '#F687B3', // rose doux
    '#F56565', // rouge
    '#4FD1C5', // menthe
  ];

  const FACE_SHAPES = ['circle', 'rounded', 'oval'];

  const ACCESSORIES = [
    'none',
    'none', // probabilité accrue d'absence
    'hat',
    'crown',
    'headband',
    'bowtie',
    'antennas',
  ];

  // ------------------------------------------------------------------
  // PRNG déterministe (Mulberry32) à partir d'un seed string
  // ------------------------------------------------------------------
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  // ------------------------------------------------------------------
  // Dessins SVG (yeux / bouches / accessoires)
  // ------------------------------------------------------------------
  const EYES = [
    // Ronds
    () =>
      `<circle cx="38" cy="46" r="5" fill="#1a1a2e"/>
       <circle cx="62" cy="46" r="5" fill="#1a1a2e"/>`,
    // Traits
    () =>
      `<rect x="32" y="44" width="14" height="4" rx="2" fill="#1a1a2e"/>
       <rect x="54" y="44" width="14" height="4" rx="2" fill="#1a1a2e"/>`,
    // Étoiles simplifiées
    () =>
      `<path d="M38 40 L40 46 L46 46 L41 50 L43 56 L38 52 L33 56 L35 50 L30 46 L36 46 Z" fill="#1a1a2e"/>
       <path d="M62 40 L64 46 L70 46 L65 50 L67 56 L62 52 L57 56 L59 50 L54 46 L60 46 Z" fill="#1a1a2e"/>`,
    // Croix
    () =>
      `<path d="M33 40 L43 50 M43 40 L33 50" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round"/>
       <path d="M57 40 L67 50 M67 40 L57 50" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round"/>`,
    // Lunettes
    () =>
      `<circle cx="38" cy="46" r="8" fill="none" stroke="#1a1a2e" stroke-width="2.5"/>
       <circle cx="62" cy="46" r="8" fill="none" stroke="#1a1a2e" stroke-width="2.5"/>
       <path d="M46 46 L54 46" stroke="#1a1a2e" stroke-width="2.5"/>
       <circle cx="38" cy="46" r="3" fill="#1a1a2e"/>
       <circle cx="62" cy="46" r="3" fill="#1a1a2e"/>`,
    // Endormis
    () =>
      `<path d="M32 46 Q38 42 44 46" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
       <path d="M56 46 Q62 42 68 46" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Heureux (arcs vers le haut)
    () =>
      `<path d="M32 48 Q38 42 44 48" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
       <path d="M56 48 Q62 42 68 48" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Gros yeux ronds avec reflet
    () =>
      `<circle cx="38" cy="46" r="7" fill="#1a1a2e"/>
       <circle cx="62" cy="46" r="7" fill="#1a1a2e"/>
       <circle cx="40" cy="44" r="2" fill="#ffffff"/>
       <circle cx="64" cy="44" r="2" fill="#ffffff"/>`,
    // Asymétriques (un ouvert un clin d'oeil)
    () =>
      `<circle cx="38" cy="46" r="5" fill="#1a1a2e"/>
       <path d="M56 46 Q62 42 68 46" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Cœurs
    () =>
      `<path d="M34 44 Q30 40 34 38 Q38 36 38 42 Q42 40 42 44 Q42 48 38 50 Q34 48 34 44 Z" fill="#FF4B5C"/>
       <path d="M58 44 Q54 40 58 38 Q62 36 62 42 Q66 40 66 44 Q66 48 62 50 Q58 48 58 44 Z" fill="#FF4B5C"/>`,
  ];

  const MOUTHS = [
    // Sourire classique
    () =>
      `<path d="M38 66 Q50 76 62 66" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Trait (neutre)
    () =>
      `<rect x="40" y="68" width="20" height="3" rx="1.5" fill="#1a1a2e"/>`,
    // Dents
    () =>
      `<path d="M36 64 Q50 76 64 64 L64 68 L36 68 Z" fill="#1a1a2e"/>
       <rect x="40" y="64" width="20" height="4" fill="#ffffff"/>`,
    // Langue tirée
    () =>
      `<path d="M38 65 Q50 74 62 65" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
       <path d="M46 70 Q50 80 54 70 Z" fill="#FF6B6B"/>`,
    // Zigzag
    () =>
      `<path d="M38 68 L44 64 L50 68 L56 64 L62 68" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
    // Petit "o" surpris
    () =>
      `<circle cx="50" cy="68" r="4" fill="#1a1a2e"/>`,
    // Moue
    () =>
      `<path d="M38 72 Q50 62 62 72" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Grand sourire
    () =>
      `<path d="M34 63 Q50 80 66 63 L66 66 Q50 82 34 66 Z" fill="#1a1a2e"/>`,
  ];

  // Accessoires (rendu au-dessus de tout)
  const ACCESSORY_SVG = {
    none: () => '',
    hat: (bg) => `
      <path d="M26 28 L74 28 L68 14 L32 14 Z" fill="#1a1a2e"/>
      <rect x="22" y="26" width="56" height="5" rx="2" fill="#1a1a2e"/>
      <rect x="40" y="18" width="20" height="4" fill="${bg}"/>
    `,
    crown: () => `
      <path d="M28 28 L36 12 L44 24 L50 10 L56 24 L64 12 L72 28 Z" fill="#FFD93D" stroke="#1a1a2e" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="36" cy="14" r="2.5" fill="#FF6B6B"/>
      <circle cx="50" cy="12" r="2.5" fill="#FF6B6B"/>
      <circle cx="64" cy="14" r="2.5" fill="#FF6B6B"/>
    `,
    headband: () => `
      <rect x="20" y="22" width="60" height="6" rx="2" fill="#FF6B6B"/>
      <circle cx="50" cy="20" r="4" fill="#FF6B6B"/>
    `,
    bowtie: () => `
      <path d="M42 82 L50 78 L58 82 L58 88 L50 84 L42 88 Z" fill="#6C63FF"/>
      <circle cx="50" cy="83" r="2" fill="#1a1a2e"/>
    `,
    antennas: () => `
      <line x1="38" y1="18" x2="34" y2="4" stroke="#1a1a2e" stroke-width="2"/>
      <line x1="62" y1="18" x2="66" y2="4" stroke="#1a1a2e" stroke-width="2"/>
      <circle cx="34" cy="4" r="3" fill="#FFD93D"/>
      <circle cx="66" cy="4" r="3" fill="#FFD93D"/>
    `,
  };

  // ------------------------------------------------------------------
  // Forme du visage
  // ------------------------------------------------------------------
  function facePath(shape) {
    // ViewBox 100x100, visage centré
    if (shape === 'circle') {
      return `<circle cx="50" cy="55" r="36" />`;
    }
    if (shape === 'rounded') {
      return `<rect x="14" y="20" width="72" height="72" rx="22" ry="22" />`;
    }
    // oval
    return `<ellipse cx="50" cy="55" rx="34" ry="38" />`;
  }

  // ------------------------------------------------------------------
  // Génération
  // ------------------------------------------------------------------
  /**
   * Crée un avatar à partir d'un seed stable.
   * @param {string} seed
   * @returns {{ seed: string, svg: string }}
   */
  function fromSeed(seed) {
    const rng = mulberry32(hashSeed(seed));
    const shape = pick(rng, FACE_SHAPES);
    const bg = pick(rng, BG_COLORS);
    const eyeIdx = Math.floor(rng() * EYES.length);
    const mouthIdx = Math.floor(rng() * MOUTHS.length);
    const accessoryKey = pick(rng, ACCESSORIES);

    const face = facePath(shape);
    const accessory = ACCESSORY_SVG[accessoryKey](bg);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
        <g fill="${bg}">${face}</g>
        ${EYES[eyeIdx]()}
        ${MOUTHS[mouthIdx]()}
        ${accessory}
      </svg>
    `.trim();

    return { seed, svg };
  }

  /**
   * Génère un seed aléatoire court.
   */
  function randomSeed() {
    return Math.random().toString(36).slice(2, 10);
  }

  /**
   * Raccourci : crée un avatar aléatoire.
   */
  function random() {
    return fromSeed(randomSeed());
  }

  /**
   * Rend un avatar dans un élément HTML (en injectant le SVG).
   * @param {HTMLElement} container
   * @param {{ seed: string, svg: string } | string} avatarOrSeed
   */
  function render(container, avatarOrSeed) {
    if (!container) return;
    const avatar =
      typeof avatarOrSeed === 'string' ? fromSeed(avatarOrSeed) : avatarOrSeed;
    container.innerHTML = avatar.svg;
    container.dataset.seed = avatar.seed;
  }

  window.Blendr.avatars = {
    fromSeed,
    random,
    randomSeed,
    render,
  };
})();
