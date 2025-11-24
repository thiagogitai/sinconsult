#!/bin/bash

# Script de build e deployment para produção - VPS Hostinger

echo "🚀 Iniciando build e deployment para produção..."

# Parar serviços atuais
echo "📋 Parando serviços atuais..."
pm2 stop simconsult 2>/dev/null || true
pm2 delete simconsult 2>/dev/null || true

# Limpar builds antigos
echo "🧹 Limpando builds antigos..."
rm -rf dist-server dist

# Build do servidor
echo "🔨 Build do servidor..."
npm run build:server

# Build do frontend com configuração de produção
echo "🎨 Build do frontend..."
npm run build:frontend

# Verificar se os arquivos foram criados
echo "🔍 Verificando arquivos de build..."
if [ ! -f "dist-server/api/server.js" ]; then
    echo "❌ Erro: Arquivo server.js não encontrado!"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "❌ Erro: Diretório dist não encontrado!"
    exit 1
fi

# Criar arquivo de ambiente de produção se não existir
echo "⚙️  Configurando ambiente de produção..."
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOF
# Configurações para build de produção
NODE_ENV=production
VITE_API_URL=/api
EOF
    echo "✅ Arquivo .env.production criado"
fi

# Garantir que o PM2 está configurado
echo "🔧 Configurando PM2..."
pm2 startup systemd -u $USER --hp $HOME

# Iniciar com PM2
echo "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
echo "💾 Salvando configuração do PM2..."
pm2 save

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "📊 Status do PM2:"
pm2 status

# Verificar logs
echo "📋 Últimas linhas dos logs:"
pm2 logs simconsult --lines 20 --nostream

echo "✅ Deployment concluído com sucesso!"
echo "🌐 Acesse: https://certcrm.com.br"
echo "🔧 Para ver logs em tempo real: pm2 logs simconsult"
echo "🔄 Para reiniciar: pm2 restart simconsult"
echo "🛑 Para parar: pm2 stop simconsult"