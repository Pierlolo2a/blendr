# Blendr 🎨

Jeu multijoueur en temps réel inspiré du téléphone arabe. Dessine, devine, perds le fil !

## Déploiement rapide sur Railway (Recommandé)

Railway offre l'hébergement gratuit le plus rapide et fiable pour Socket.IO.

### 1. Publier sur GitHub

```bash
# Initialise Git
git init
git add .
git commit -m "Initial commit"

# Crée un repo sur GitHub (sans README, sans .gitignore)
# Puis push :
git remote add origin https://github.com/TON_USERNAME/blendr.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi avec GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Sélectionne ton repo `blendr`
4. Railway détecte automatiquement Node.js et déploie !

### 3. Configurer les variables d'environnement

Dans l'onglet "Variables" de ton projet Railway, ajoute :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://ton-projet.up.railway.app` (l'URL générée par Railway) |

Remplace la valeur de `CORS_ORIGIN` par l'URL que Railway te donne après le premier déploiement.

### 4. Redémarrer

Railway redéploie automatiquement quand tu modifies les variables.

## Fonctionnalités

- 🔒 **Sécurisé** : Rate limiting, validation stricte, protection XSS
- ⚡ **Temps réel** : WebSocket avec Socket.IO
- 🎨 **Canvas** : Dessin avec outils complets (stylo, gomme, couleurs)
- 👥 **Multi-joueur** : Jusqu'à 12 joueurs par partie
- 🏠 **Rooms** : Crée ou rejoins avec un code à 5 caractères

## Développement local

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`.

## Architecture de sécurité

- Rate limit HTTP : 200 req / 15 min / IP
- Rate limit connexions Socket.IO : 10 / min / IP
- Rate limit création rooms : 5 / heure / IP
- Protection burst chat : max 3 messages en 2 secondes
- Validation taille images : 500 Ko max
- Timeout inactivité lobby : 30 minutes
- Limite mémoire : 20 steps max par chaîne
- Headers Helmet (CSP, XSS, clickjacking)

## Stack technique

- **Backend** : Node.js, Express, Socket.IO
- **Frontend** : Vanilla JavaScript, HTML5 Canvas, Web Audio API
- **Déploiement** : Railway (Node.js + WebSocket support natif)

## Licence

MIT
