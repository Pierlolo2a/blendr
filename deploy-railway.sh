#!/bin/bash

# Script de déploiement Railway pour Blendr
# Usage: ./deploy-railway.sh

set -e

echo "🎨 Blendr - Déploiement Railway"
echo "================================"
echo ""

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé."
    echo ""
    echo "Installation:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Ou avec Homebrew:"
    echo "  brew install railway"
    echo ""
    exit 1
fi

echo "✅ Railway CLI détecté"

# Vérifier l'authentification
if ! railway whoami &> /dev/null; then
    echo "🔐 Connexion à Railway nécessaire..."
    railway login
fi

echo "✅ Connecté à Railway"

# Vérifier si un projet existe déjà
if ! railway status &> /dev/null; then
    echo "🚀 Création d'un nouveau projet Railway..."
    railway init
else
    echo "✅ Projet Railway existant détecté"
fi

# Déployer
echo ""
echo "🚀 Déploiement en cours..."
railway up

echo ""
echo "✅ Déploiement terminé !"
echo ""

# Afficher l'URL
URL=$(railway status 2>/dev/null | grep -o 'https://[^ ]*' || echo "")
if [ -n "$URL" ]; then
    echo "🌐 URL de l'application: $URL"
    echo ""
    echo "⚠️  N'oublie pas de configurer CORS_ORIGIN dans les variables Railway:"
    echo "   railway variables set CORS_ORIGIN=$URL"
fi

echo ""
echo "📊 Pour voir les logs: railway logs"
echo "🔧 Pour ouvrir le dashboard: railway open"
