# 🚀 Comandos Rápidos - Hostinger VPS (TUDO no Servidor)

## 📋 Comandos Essenciais para Deploy Completo

---

## 1️⃣ Instalar Node.js e PM2

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar
node --version
npm --version

# Instalar PM2
npm install -g pm2
```

---

## 2️⃣ Preparar Ambiente

```bash
# Criar pasta do projeto
mkdir -p /var/www/simconsult
cd /var/www/simconsult

# Clonar repositório
git clone https://github.com/thiagogitai/sinconsult.git .

# OU fazer upload via SCP do seu PC:
# scp -r * root@seu-servidor:/var/www/simconsult/
```

---

## 3️⃣ Instalar e Configurar

```bash
# Instalar dependências
npm install --production

# Criar .env
cp .env.example .env
nano .env  # Colar suas API keys reais

# Criar pastas
mkdir -p data uploads/audio uploads/images logs
chmod 755 data uploads logs
chmod 600 .env
```

---

## 4️⃣ Build e Iniciar

```bash
# Build completo
npm run build:production

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar e configurar boot
pm2 save
pm2 startup
# Execute o comando que aparecer
```

---

## 5️⃣ Configurar Nginx (Opcional mas Recomendado)

```bash
# Criar configuração
nano /etc/nginx/sites-available/simconsult
```

**Cole:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar:**

```bash
ln -s /etc/nginx/sites-available/simconsult /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 6️⃣ SSL (HTTPS)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 7️⃣ Firewall

```bash
# Permitir portas
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Ativar
ufw enable
```

---

## ✅ Verificar

```bash
# Status PM2
pm2 status

# Logs
pm2 logs simconsult

# Testar
curl http://localhost:3006/api/health
```

**Acesse:** `http://seu-dominio.com`

---

## 🔄 Atualizar

```bash
cd /var/www/simconsult
git pull origin main
npm install --production
npm run build:production
pm2 restart simconsult
```

---

## 📊 Comandos Úteis

```bash
# Ver logs
pm2 logs simconsult

# Reiniciar
pm2 restart simconsult

# Parar
pm2 stop simconsult

# Status
pm2 status

# Monitoramento
pm2 monit
```

---

**Pronto! Tudo rodando no seu VPS! 🚀**

