#!/bin/bash

echo "=== BUILD PARA PRODUÇÃO ==="

# Limpar builds antigos
echo "Limpando builds antigos..."
rm -rf dist dist-server

# Build do servidor
echo "Build do servidor..."
npm run build:server

# Build do frontend com variáveis corretas
echo "Build do frontend..."
VITE_API_URL=/api NODE_ENV=production npm run build:frontend

# Verificar se o build foi criado
echo "Verificando arquivos de build..."
ls -la dist/index.html 2>/dev/null && echo "✅ Frontend build OK" || echo "❌ Frontend build falhou"
ls -la dist-server/api/server.js 2>/dev/null && echo "✅ Backend build OK" || echo "❌ Backend build falhou"

# Verificar se há URLs hardcoded
echo "Verificando URLs hardcoded no build..."
if grep -r "certcrm.com.br" dist/; then
    echo "❌ URLs hardcoded encontradas!"
    exit 1
else
    echo "✅ Nenhuma URL hardcoded encontrada"
fi

echo "=== BUILD CONCLUÍDO ==="