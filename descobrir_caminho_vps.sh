#!/bin/bash

echo "=== DESCOBRINDO CAMINHO DO PROJETO NO VPS ==="
echo ""

# Método 1: Verificar pelo PM2
echo "1. Verificando pelo PM2:"
pm2 info simconsult 2>/dev/null | grep -E "script path|exec cwd" || echo "   PM2 não encontrado ou app não está rodando"
echo ""

# Método 2: Verificar processos Node
echo "2. Verificando processos Node rodando:"
ps aux | grep "node.*server.js" | grep -v grep | awk '{print $NF}'
echo ""

# Método 3: Verificar working directory do PM2
echo "3. Working directory do PM2:"
pm2 describe simconsult 2>/dev/null | grep "cwd" || echo "   Não encontrado"
echo ""

# Método 4: Procurar arquivo server.js compilado
echo "4. Procurando arquivo dist-server/api/server.js:"
find /home -name "server.js" -path "*/dist-server/api/*" 2>/dev/null | head -5
find /var/www -name "server.js" -path "*/dist-server/api/*" 2>/dev/null | head -5
find /opt -name "server.js" -path "*/dist-server/api/*" 2>/dev/null | head -5
echo ""

# Método 5: Verificar onde está o git
echo "5. Verificando repositórios git:"
find /home -name ".git" -type d 2>/dev/null | grep -E "Sim|sim" | head -5
find /var/www -name ".git" -type d 2>/dev/null | grep -E "Sim|sim" | head -5
echo ""

echo "=== FIM ==="
echo ""
echo "Execute este script no VPS e me envie o resultado!"

