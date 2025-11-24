#!/bin/bash
# Script definitivo para resolver deploy no VPS
# Autor: Sistema CRM WhatsApp

echo "🚀 RESOLVENDO PROBLEMAS DE DEPLOY NO VPS"
echo "========================================="

# Ir para o diretório do projeto
cd ~/simconsult

echo "📍 Diretório atual: $(pwd)"

# Parar o serviço antes de fazer alterações
echo "⏹️ Parando serviço PM2..."
pm2 stop simconsult || true

# Resolver conflitos de arquivo
echo "🗑️ Removendo arquivos conflitantes..."
rm -f test_instance.json
rm -f database.sqlite
rm -f api/database.sqlite

# Limpar cache e builds antigos
echo "🧹 Limpando builds antigos..."
rm -rf dist dist-server node_modules/.cache

# Fazer pull das últimas correções
echo "📥 Baixando últimas correções..."
git stash || true
git pull origin main

# Reinstalar dependências
echo "📦 Reinstalando dependências..."
npm install

# Build do servidor com tratamento de erros
echo "🔨 Build do servidor..."
if npm run build:server; then
    echo "✅ Build do servidor: SUCESSO"
else
    echo "❌ Build do servidor: FALHOU"
    echo "Verificando erros..."
    npm run build:server 2>&1 | head -20
    exit 1
fi

# Build do frontend
echo "🎨 Build do frontend..."
if npm run build:frontend; then
    echo "✅ Build do frontend: SUCESSO"
else
    echo "❌ Build do frontend: FALHOU"
    exit 1
fi

# Reiniciar serviço
echo "🔄 Reiniciando serviço..."
pm2 restart simconsult

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar status
echo "📊 Status do serviço:"
pm2 status

# Verificar logs
echo "📄 Últimas linhas do log:"
pm2 logs simconsult --lines 10 --nostream

echo ""
echo "✅ DEPLOY CONCLUÍDO!"
echo "==================="
echo ""
echo "Próximos passos:"
echo "1. Verificar se o site está funcionando em: https://certcrm.com.br"
echo "2. Testar as notificações no sistema"
echo "3. Verificar se WhatsApp instances estão funcionando"
echo ""
echo "Se ainda houver problemas, execute:"
echo "pm2 logs simconsult --lines 50"