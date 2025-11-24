#!/bin/bash
# Script para resolver conflitos e completar deploy no VPS

echo "🚀 Iniciando deploy no VPS..."

# Ir para o diretório do projeto
cd ~/simconsult

# Verificar status atual
echo "📋 Status atual do repositório:"
git status

# Remover arquivo conflitante
echo "🗑️ Removendo arquivo conflitante..."
rm -f test_instance.json

# Fazer stash das alterações locais (se houver)
echo "📦 Fazendo stash de alterações locais..."
git stash || true

# Fazer pull das últimas alterações
echo "📥 Fazendo pull das últimas alterações..."
git pull origin main

# Restaurar stash (se houver)
echo "📤 Restaurando alterações locais..."
git stash pop || true

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build do servidor
echo "🔨 Build do servidor..."
npm run build:server

# Build do frontend
echo "🎨 Build do frontend..."
npm run build:frontend

# Restart do PM2
echo "🔄 Restart do PM2..."
pm2 restart simconsult

# Verificar logs
echo "📄 Verificando logs..."
pm2 logs simconsult --lines 20

# Status final
echo "📊 Status final:"
pm2 status

echo "✅ Deploy concluído com sucesso!"