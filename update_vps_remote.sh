#!/bin/bash

# Script para executar no VPS via painel ou SSH
# Execute: bash update_vps_remote.sh

echo "=== ATUALIZANDO SISTEMA CRM ==="

# Navegar para diretório do projeto
cd /root/simconsult 2>/dev/null || cd /home/simconsult 2>/dev/null || cd /var/www/simconsult 2>/dev/null || {
    echo "❌ Diretório do projeto não encontrado!"
    echo "Por favor, execute: find / -name "package.json" -path "*/simconsult/*" 2>/dev/null"
    exit 1
}

echo "📁 Diretório encontrado: $(pwd)"

# Parar serviços
echo "Parando serviços..."
pm2 stop simconsult 2>/dev/null || true
pm2 delete simconsult 2>/dev/null || true

# Backup do banco de dados
echo "Criando backup do banco..."
cp database.sqlite database.sqlite.backup 2>/dev/null || true

# Atualizar código
echo "Atualizando código..."
git pull origin main

# Limpar e reinstalar
echo "Reinstalando dependências..."
rm -rf node_modules package-lock.json dist dist-server
npm install

# Build com variáveis corretas
echo "Build do servidor..."
npm run build:server

echo "Build do frontend..."
export VITE_API_URL=/api
export NODE_ENV=production
npm run build:frontend

# Verificar builds
if [ -f "dist-server/api/server.js" ] && [ -f "dist/index.html" ]; then
    echo "✅ Builds criados com sucesso"
else
    echo "❌ Erro ao criar builds"
    exit 1
fi

# Verificar se não há URLs hardcoded
if grep -r "certcrm.com.br" dist/; then
    echo "❌ URLs hardcoded encontradas no build!"
    exit 1
else
    echo "✅ Nenhuma URL hardcoded encontrada"
fi

# Iniciar serviço
echo "Iniciando serviço..."
pm2 start ecosystem.config.cjs
pm2 save

# Aguardar inicialização
sleep 5

# Verificar status
echo "Verificando status..."
pm2 status

# Testar conexões
echo "Testando conexões..."
echo "1. Testando servidor local:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/whatsapp/test-connection
echo ""

echo "2. Testando Evolution API:"
curl -s http://localhost:3006/api/whatsapp/test-connection | jq '.' 2>/dev/null || echo "Erro ao testar Evolution API"

echo "3. Testando endpoint de instâncias:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/whatsapp/instances
echo ""

echo "=== SISTEMA ATUALIZADO ==="
echo "Acesse: https://certcrm.com.br"
echo "Verifique os logs: pm2 logs simconsult --lines 20"