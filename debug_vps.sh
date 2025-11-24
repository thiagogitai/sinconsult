#!/bin/bash

# Script de debug para VPS - Verificar logs e status

echo "🔍 Verificando status do sistema..."

echo "📊 Status do PM2:"
pm2 status

echo ""
echo "📋 Últimas 50 linhas do log:"
pm2 logs simconsult --lines 50 --nostream

echo ""
echo "🔍 Verificando portas:"
netstat -tulpn | grep :3006 || echo "Porta 3006 não está em uso"

echo ""
echo "🌐 Testando conexão com Evolution API:"
curl -s -H "apikey: 0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc" https://solitarybaboon-evolution.cloudfy.live/ | jq . 2>/dev/null || echo "Evolution API não está respondendo"

echo ""
echo "🔧 Testando endpoint local:"
curl -s http://localhost:3006/api/whatsapp/test-connection | jq . 2>/dev/null || echo "Endpoint local não está respondendo"

echo ""
echo "✅ Verificação concluída!"