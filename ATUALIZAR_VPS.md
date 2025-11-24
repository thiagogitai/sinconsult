# Comandos para Atualizar o Sistema no VPS

## Atualizar Código do GitHub

```bash
# 1. Ir para pasta do projeto
cd ~/simconsult

# 2. Atualizar código do GitHub
git pull origin main

# 3. Instalar novas dependências (se houver)
npm install

# 4. Rebuild do servidor (se necessário)
npm run build:server

# 5. Rebuild do frontend (se necessário)
npm run build:frontend

# 6. Parar PM2
pm2 stop simconsult

# 7. Reiniciar PM2
pm2 start ecosystem.config.cjs

# 8. Salvar configuração PM2
pm2 save

# 9. Ver status
pm2 status

# 10. Ver logs (se necessário)
pm2 logs simconsult --lines 50
```

## Comando Rápido (Tudo de uma vez)

```bash
cd ~/simconsult && \
git pull origin main && \
npm install && \
npm run build:server && \
npm run build:frontend && \
pm2 restart simconsult && \
pm2 save && \
pm2 logs simconsult --lines 20
```

## Se houver conflitos ou problemas

```bash
# Verificar mudanças locais
git status

# Se houver mudanças locais que conflitam:
git stash
git pull origin main
git stash pop

# Ou forçar atualização (CUIDADO: perde mudanças locais)
git fetch origin
git reset --hard origin/main
```

## Verificar se está funcionando

```bash
# Ver logs em tempo real
pm2 logs simconsult

# Ver status do PM2
pm2 status

# Verificar se o servidor está respondendo
curl http://localhost:3006/api/health
```

