#!/bin/bash

# Script de diagnostic pour le serveur Blendr

echo "=== DIAGNOSTIC BLENDR ==="
echo ""

echo "1. Vérification du port 3000..."
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_3000" ]; then
  echo "⚠️  Le port 3000 est occupé par le processus : $PORT_3000"
  echo "   Pour le libérer : kill $PORT_3000"
else
  echo "✓ Port 3000 libre"
fi

echo ""
echo "2. Vérification d'iCloud Desktop..."
if [ -e ~/Desktop/.DS_Store ]; then
  if xattr -l ~/Desktop/.DS_Store 2>/dev/null | grep -q "com.apple.metadata"; then
    echo "⚠️  Desktop synchronisé avec iCloud détecté"
    echo "   Recommandation : Déplacer le projet vers ~/Documents/"
  else
    echo "✓ Desktop local (pas d'iCloud)"
  fi
fi

echo ""
echo "3. Emplacement actuel du projet..."
echo "   $(pwd)"

if [[ "$(pwd)" == *"/Desktop/"* ]]; then
  echo "⚠️  Projet sur Desktop (risque de conflit iCloud)"
  echo ""
  echo "   SOLUTION RAPIDE :"
  echo "   cp -r ~/Desktop/blendr ~/Documents/blendr"
  echo "   cd ~/Documents/blendr"
  echo "   npm install"
  echo "   npm start"
fi

echo ""
echo "4. Test de connexion serveur..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://127.0.0.1:3000/health 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
  echo "✓ Serveur répond sur http://127.0.0.1:3000"
else
  echo "✗ Serveur ne répond pas (code: $RESPONSE)"
fi

echo ""
echo "5. Processus Node.js en cours..."
ps aux | grep "node server.js" | grep -v grep || echo "   Aucun serveur en cours"

echo ""
echo "=== FIN DU DIAGNOSTIC ==="
