#!/usr/bin/env bash

# Sai do script se qualquer comando falhar
set -e

echo "=== Passo 1: Garantindo que estamos na 'develop' ==="
git checkout develop
git pull origin develop

echo "=== Passo 2: Trocando para a branch 'main' e atualizando ==="
git checkout main
git pull origin main

echo "=== Passo 3: Fazendo merge da 'develop' na 'main' ==="
git merge develop

# Se houver conflitos, o script para aqui. Resolva-os manualmente, depois:
# git add .
# git commit
# E rode o script novamente ou continue daqui.

echo "=== Passo 4 (opcional): Rodando build local para testar ==="
npm install
npm run build

# Se preferir Yarn, troque por:
# yarn install
# yarn build

echo "=== Passo 5: Fazendo push para a 'main' ==="
git push origin main

echo "=== Passo 6: Iniciando o deploy de produção na Vercel (manual) ==="
# IMPORTANTE: para isso funcionar, você precisa ter o Vercel CLI instalado
# e estar logado (via 'vercel login').
vercel --prod

echo "=== Deploy finalizado! ==="
echo "Verifique no painel da Vercel se tudo correu bem."
