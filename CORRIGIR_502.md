# 🔧 Como Corrigir Erro 502 Bad Gateway

## Diagnóstico Rápido

O erro 502 significa que o Nginx não consegue se conectar ao Node.js. Execute estes comandos:

```bash
# 1. Ver logs do PM2 para identificar o erro
pm2 logs simconsult --lines 50

# 2. Verificar se o processo está realmente rodando
pm2 status

# 3. Verificar se a porta 3006 está em uso
netstat -tlnp | grep 3006
# OU
ss -tlnp | grep 3006

# 4. Testar se o servidor responde localmente
curl http://localhost:3006/api/health
# OU
curl http://localhost:3006
```

## Soluções Comuns

### 1. Servidor não está iniciando (erro nos logs)

```bash
# Ver logs detalhados
pm2 logs simconsult --err --lines 100

# Se houver erro, parar e reiniciar
pm2 stop simconsult
pm2 delete simconsult
pm2 start ecosystem.config.cjs
pm2 save
```

### 2. Porta 3006 não está sendo usada

```bash
# Verificar se o servidor está escutando
lsof -i :3006

# Se não estiver, verificar o .env
cat .env | grep PORT

# Se PORT não estiver definido, adicionar:
echo "PORT=3006" >> .env
pm2 restart simconsult
```

### 3. Erro de compilação TypeScript

```bash
# Limpar e recompilar
rm -rf dist-server
npm run build:server

# Verificar se os arquivos foram criados
ls -la dist-server/api/server.js

# Se não existir, há erro de compilação
```

### 4. Verificar configuração do Nginx

```bash
# Ver configuração do Nginx
cat /etc/nginx/sites-available/certcrm

# Verificar se está apontando para localhost:3006
# Deve ter: proxy_pass http://localhost:3006;

# Testar configuração do Nginx
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

### 5. Verificar permissões e arquivos

```bash
# Verificar se o arquivo do servidor existe
ls -la dist-server/api/server.js

# Verificar permissões
chmod +x dist-server/api/server.js

# Verificar se o .env existe e tem as variáveis necessárias
cat .env | grep -E "JWT_SECRET|PORT"
```

## Comando Completo de Diagnóstico

```bash
cd ~/simconsult && \
echo "=== PM2 Status ===" && \
pm2 status && \
echo -e "\n=== Últimos Logs ===" && \
pm2 logs simconsult --lines 20 --nostream && \
echo -e "\n=== Porta 3006 ===" && \
netstat -tlnp | grep 3006 && \
echo -e "\n=== Teste Local ===" && \
curl -s http://localhost:3006/api/health || echo "Servidor não responde" && \
echo -e "\n=== Arquivo Server ===" && \
ls -la dist-server/api/server.js
```

## Solução Rápida (Tentar Tudo)

```bash
cd ~/simconsult

# Parar tudo
pm2 stop simconsult
pm2 delete simconsult

# Limpar builds
rm -rf dist-server dist

# Rebuild completo
npm run build:server
npm run build:frontend

# Verificar se compilou
if [ ! -f "dist-server/api/server.js" ]; then
    echo "ERRO: Servidor não compilou!"
    npm run build:server 2>&1 | tail -20
    exit 1
fi

# Iniciar novamente
pm2 start ecosystem.config.cjs
pm2 save

# Aguardar 3 segundos
sleep 3

# Verificar status
pm2 status
pm2 logs simconsult --lines 10 --nostream

# Testar
curl http://localhost:3006/api/health
```

## Se Nada Funcionar

```bash
# Iniciar manualmente para ver o erro
cd ~/simconsult
node dist-server/api/server.js
```

Isso mostrará o erro exato que está impedindo o servidor de iniciar.

