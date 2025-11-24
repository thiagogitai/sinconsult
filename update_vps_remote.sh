#!/bin/bash

# Script de deployment para VPS - Atualização completa com correção de URLs

echo "🚀 Iniciando deployment completo do sistema..."

# Parar serviços atuais
echo "📋 Parando serviços atuais..."
pm2 stop simconsult || true
pm2 delete simconsult || true

# Limpar builds antigos
echo "🧹 Limpando builds antigos..."
rm -rf dist-server dist

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main || echo "⚠️  Não foi possível fazer pull, continuando com código atual..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

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

# Garantir que as variáveis de ambiente estão configuradas
echo "🔐 Verificando variáveis de ambiente..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    source .env
else
    echo "⚠️  Arquivo .env não encontrado, criando um básico..."
    cat > .env << EOF
NODE_ENV=production
PORT=3006
JWT_SECRET=super-secret-jwt-key-2025-simconsult-secure-token-change-in-production
VITE_API_URL=/api
EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_KEY=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc
EOF
fi

# Iniciar com PM2
echo "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.cjs

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "📊 Status do PM2:"
pm2 status

# Verificar logs
echo "📋 Últimas linhas dos logs:"
pm2 logs simconsult --lines 20 --nostream

echo "✅ Deployment concluído!"
echo "🌐 Acesse: https://certcrm.com.br"
echo "🔧 Para ver logs em tempo real: pm2 logs simconsult"