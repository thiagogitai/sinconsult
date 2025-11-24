#!/bin/bash

# Script para atualizar o VPS após push
# Caminho: /root/simconsult

echo "🚀 Atualizando VPS em /root/simconsult..."

cd /root/simconsult

echo "📥 Fazendo pull das alterações..."
git pull origin main

echo "📦 Instalando dependências (se necessário)..."
npm install

echo "🔨 Recompilando servidor..."
npm run build:server

echo "🎨 Recompilando frontend..."
npm run build:frontend

echo "🔄 Reiniciando aplicação..."
pm2 restart simconsult

echo "✅ Atualização concluída!"
echo ""
echo "📊 Status do PM2:"
pm2 status simconsult

echo ""
echo "📋 Últimos logs:"
pm2 logs simconsult --lines 10 --nostream

