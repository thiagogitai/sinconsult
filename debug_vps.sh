#!/bin/bash

echo "=== DEBUG VPS STATUS ==="
echo "Data: $(date)"
echo ""

echo "1. Verificando se o servidor está rodando:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/whatsapp/test-connection
echo ""

echo "2. Verificando conexão com Evolution API:"
curl -s http://localhost:3006/api/whatsapp/test-connection | jq '.'
echo ""

echo "3. Verificando processos PM2:"
pm2 status
echo ""

echo "4. Verificando logs recentes:"
pm2 logs simconsult --lines 10 --nostream
echo ""

echo "5. Verificando se arquivos existem:"
ls -la dist-server/api/server.js 2>/dev/null || echo "❌ dist-server/api/server.js não encontrado"
ls -la dist/index.html 2>/dev/null || echo "❌ dist/index.html não encontrado"
echo ""

echo "6. Verificando variáveis de ambiente:"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "VITE_API_URL: $VITE_API_URL"
echo "FRONTEND_URL: $FRONTEND_URL"
echo ""

echo "=== FIM DO DEBUG ==="