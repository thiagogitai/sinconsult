# 🚀 Deploy COMPLETO na Hostinger (Frontend + Backend)

Guia para colocar **TUDO** na Hostinger - Frontend e Backend juntos.

---

## 📋 Pré-requisitos

1. ✅ Conta Hostinger com **VPS** ou plano que suporte **Node.js**
2. ✅ Acesso SSH
3. ✅ Domínio configurado

**Nota:** Se seu plano Hostinger não tem Node.js, você precisa:
- **Opção 1**: Fazer upgrade para VPS Hostinger
- **Opção 2**: Usar outro VPS (DigitalOcean, Linode, etc.) e apontar domínio

---

## 🔧 Passo 1: Conectar via SSH

```bash
# Conectar ao servidor
ssh root@seu-ip-ou-dominio.com
# ou
ssh usuario@seu-servidor.hostinger.com
```

---

## 📦 Passo 2: Instalar Node.js (Se não tiver)

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 globalmente
npm install -g pm2
```

---

## 📥 Passo 3: Clonar Repositório

```bash
# Ir para pasta do site
cd /var/www/html
# ou
cd ~/public_html
# ou criar pasta específica
mkdir -p /var/www/simconsult
cd /var/www/simconsult

# Clonar repositório
git clone https://github.com/thiagogitai/sinconsult.git .

# Ou fazer upload via SCP do seu computador:
# scp -r * root@seu-servidor:/var/www/simconsult/
```

---

## 📦 Passo 4: Instalar Dependências

```bash
# Instalar dependências de produção
npm install --production

# Se der erro de permissão:
sudo npm install --production
```

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar arquivo
nano .env
```

**Cole e edite com seus valores reais:**

```env
NODE_ENV=production
PORT=3006
FRONTEND_URL=https://seu-dominio.com

JWT_SECRET=SUA_CHAVE_SECRETA_FORTE_AQUI_MUDE_ISTO

EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_KEY=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc

OPENAI_API_KEY=sua-api-key-openai
ELEVENLABS_API_KEY=sua-api-key-elevenlabs

ZENVIA_API_TOKEN=seu-token-zenvia
ZENVIA_FROM=seu-numero-zenvia
```

**Salvar:** `Ctrl + X`, `Y`, `Enter`

---

## 📁 Passo 6: Criar Diretórios

```bash
# Criar pastas necessárias
mkdir -p data uploads/audio uploads/images logs

# Dar permissões
chmod 755 data uploads logs
chmod 755 uploads/audio uploads/images
chmod 600 .env
```

---

## 🔨 Passo 7: Build do Projeto

```bash
# Build completo (frontend + backend)
npm run build:production

# Se der erro, fazer separado:
npm run build          # Frontend
npm run build:server   # Backend
```

---

## 🚀 Passo 8: Configurar PM2

```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Execute o comando que aparecer (algo como: sudo env PATH=...)

# Ver status
pm2 status

# Ver logs
pm2 logs simconsult
```

---

## 🌐 Passo 9: Configurar Nginx (Recomendado)

Se você tem Nginx instalado, configure proxy reverso:

```bash
# Criar arquivo de configuração
nano /etc/nginx/sites-available/simconsult
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS (se tiver SSL)
    # return 301 https://$server_name$request_uri;

    # Ou servir diretamente (sem SSL)
    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar site:**

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/simconsult /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## 🔒 Passo 10: Configurar SSL (HTTPS)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já configurado)
certbot renew --dry-run
```

---

## 🔥 Passo 11: Configurar Firewall

```bash
# Permitir portas necessárias
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3006/tcp  # Node.js (apenas localhost)

# Ativar firewall
ufw enable

# Ver status
ufw status
```

---

## ✅ Passo 12: Verificar Funcionamento

```bash
# Verificar se PM2 está rodando
pm2 status

# Ver logs
pm2 logs simconsult --lines 50

# Verificar porta
netstat -tulpn | grep 3006

# Testar localmente
curl http://localhost:3006/api/health
```

**Acesse no navegador:**
- `http://seu-dominio.com` (ou `https://` se tiver SSL)

---

## 🔄 Comandos de Manutenção

### Atualizar Código

```bash
# Fazer backup do banco
cp data/crm_whatsapp.db data/crm_whatsapp.db.backup

# Atualizar código
cd /var/www/simconsult
git pull origin main

# Reinstalar dependências (se houver novas)
npm install --production

# Rebuild
npm run build:production

# Reiniciar
pm2 restart simconsult
```

### Ver Logs

```bash
# Logs em tempo real
pm2 logs simconsult

# Últimas 100 linhas
pm2 logs simconsult --lines 100

# Apenas erros
pm2 logs simconsult --err

# Logs do sistema
tail -f logs/app.log
```

### Reiniciar Servidor

```bash
# Reiniciar aplicação
pm2 restart simconsult

# Parar
pm2 stop simconsult

# Iniciar
pm2 start ecosystem.config.js

# Reiniciar tudo
pm2 restart all
```

---

## 🐛 Troubleshooting

### Servidor não inicia

```bash
# Ver erros
pm2 logs simconsult --err

# Verificar se porta está livre
netstat -tulpn | grep 3006

# Verificar variáveis de ambiente
cat .env

# Testar manualmente
node dist-server/api/server.js
```

### Frontend não carrega

```bash
# Verificar se build foi feito
ls -la dist/

# Rebuild frontend
npm run build

# Verificar permissões
chmod -R 755 dist/
```

### Erro de permissão

```bash
# Dar permissões corretas
chmod -R 755 /var/www/simconsult
chmod 600 /var/www/simconsult/.env
chown -R www-data:www-data /var/www/simconsult
```

### Banco de dados não funciona

```bash
# Verificar pasta data
ls -la data/

# Dar permissões
chmod 755 data/
chmod 644 data/*.db

# Verificar se SQLite está instalado
sqlite3 --version
```

### Nginx não funciona

```bash
# Verificar status
systemctl status nginx

# Ver logs
tail -f /var/log/nginx/error.log

# Testar configuração
nginx -t

# Reiniciar
systemctl restart nginx
```

---

## 📝 Checklist Completo

- [ ] Node.js instalado (v20.x ou superior)
- [ ] PM2 instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Arquivo `.env` configurado
- [ ] Diretórios criados (`data/`, `uploads/`, `logs/`)
- [ ] Build executado (`npm run build:production`)
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado (se usar)
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Testes realizados
- [ ] Logs verificados

---

## 🎯 Resumo dos Comandos Essenciais

```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# 2. Clonar projeto
cd /var/www
git clone https://github.com/thiagogitai/sinconsult.git simconsult
cd simconsult

# 3. Instalar e configurar
npm install --production
cp .env.example .env
nano .env  # Editar com suas keys

# 4. Criar pastas
mkdir -p data uploads/audio uploads/images logs
chmod 755 data uploads logs
chmod 600 .env

# 5. Build
npm run build:production

# 6. Iniciar
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Configurar Nginx (se usar)
# Editar /etc/nginx/sites-available/simconsult
# ln -s /etc/nginx/sites-available/simconsult /etc/nginx/sites-enabled/
# nginx -t && systemctl restart nginx

# 8. SSL (se usar)
# certbot --nginx -d seu-dominio.com
```

---

## 🔐 Segurança

1. ✅ Use `JWT_SECRET` forte (mínimo 32 caracteres aleatórios)
2. ✅ Configure firewall (UFW)
3. ✅ Use HTTPS (SSL)
4. ✅ Mantenha Node.js atualizado
5. ✅ Configure backup automático do banco
6. ✅ Monitore logs regularmente
7. ✅ Use senhas fortes para SSH

---

## 📞 Suporte

- 📚 Documentação Hostinger: https://support.hostinger.com
- 🔍 PM2 Docs: https://pm2.keymetrics.io
- 🐛 Logs: `pm2 logs simconsult`
- 📊 Status: `pm2 status`

---

**Pronto! Tudo rodando na Hostinger! 🚀**

