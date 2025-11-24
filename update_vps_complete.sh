#!/bin/bash

echo "=== ATUALIZANDO VPS COM NOVAS CORREÇÕES ==="

# Parar serviço
pm2 stop simconsult
pm2 delete simconsult

# Limpar completamente
rm -rf dist-server dist node_modules package-lock.json

# Reinstalar dependências
echo "Instalando dependências..."
npm install

# Build com variáveis corretas
echo "Build do servidor..."
npm run build:server

echo "Build do frontend..."
VITE_API_URL=/api NODE_ENV=production npm run build:frontend

# Verificar builds
if [ -f "dist-server/api/server.js" ] && [ -f "dist/index.html" ]; then
    echo "✅ Builds criados com sucesso"
else
    echo "❌ Erro ao criar builds"
    exit 1
fi

# Iniciar serviço
pm2 start ecosystem.config.cjs
pm2 save

# Aguardar inicialização
sleep 5

# Verificar status
pm2 status

# Testar conexão
echo "Testando conexão..."
curl -s http://localhost:3006/api/whatsapp/test-connection | jq '.'

echo "=== ATUALIZAÇÃO CONCLUÍDA ==="