#!/usr/bin/env bash

# Sai do script se qualquer comando falhar
set -e

echo "=== 1. Garantindo que estamos na 'develop' ==="
git checkout develop
git pull origin develop

echo "=== 2. Indo para 'main' e atualizando ==="
git checkout main
git pull origin main

echo "=== 3. Fazendo merge da 'develop' na 'main' ==="
git merge develop

# Se houver conflitos, o script para aqui. Resolva manualmente, depois:
# git add .
# git commit

echo "=== 4. (Opcional) Rodando build local para testar ==="
npm install
npm run build

echo "=== 5. Fazendo push para a 'main' ==="
git push origin main

echo "=== Deploy iniciado! Verifique a Vercel para acompanhar o build. ==="
