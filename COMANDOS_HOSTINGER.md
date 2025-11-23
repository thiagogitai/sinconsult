# 🚀 Comandos para Deploy na Hostinger

## 📋 Passo a Passo Completo

### 1️⃣ Preparação Local (Opcional - para testar build)

```bash
# No seu computador local
cd C:\xampp\htdocs\sim\Sim

# Build do projeto
npm run build:production
```

---

### 2️⃣ Conectar via SSH na Hostinger

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.hostinger.com
# ou
ssh usuario@IP_DO_SERVIDOR
```

**Nota:** Se não tiver acesso SSH, use o **File Manager** do hPanel para fazer upload dos arquivos.

---

### 3️⃣ No Servidor Hostinger - Preparar Ambiente

```bash
# Navegar para a pasta do site
cd ~/public_html
# ou
cd ~/domains/seu-dominio.com/public_html

# Limpar pasta (se necessário - CUIDADO!)
# rm -rf * (apenas se quiser limpar tudo)

# Clonar repositório (ou fazer upload via File Manager)
git clone https://github.com/thiagogitai/sinconsult.git .

# OU se já existe, atualizar:
git pull origin main
```

---

### 4️⃣ Instalar Dependências

```bash
# Instalar apenas dependências de produção
npm install --production

# Se der erro de permissão:
sudo npm install --production
```

---

### 5️⃣ Criar Arquivo .env

```bash
# Copiar template
cp .env.example .env

# Editar arquivo
nano .env
# ou
vi .env
```

**Cole e edite com seus valores:**

```env
NODE_ENV=production
PORT=3006
FRONTEND_URL=https://seu-dominio.com

JWT_SECRET=SUA_CHAVE_SECRETA_FORTE_AQUI_MUDE_ISTO

EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_KEY=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc

OPENAI_API_KEY=sua-api-key-openai-aqui

ELEVENLABS_API_KEY=sua-api-key-elevenlabs-aqui

ZENVIA_API_TOKEN=seu-token-zenvia-aqui
ZENVIA_FROM=seu-numero-zenvia-aqui
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

---

### 6️⃣ Criar Diretórios Necessários

```bash
# Criar pastas para dados, uploads e logs
mkdir -p data uploads/audio uploads/images logs

# Dar permissões
chmod 755 data uploads logs
chmod 755 uploads/audio uploads/images
```

---

### 7️⃣ Build do Projeto

```bash
# Build completo (frontend + backend)
npm run build:production

# Se der erro, tente:
npm run build
npm run build:server
```

---

### 8️⃣ Configurar Node.js no hPanel

**Via Interface Web (Recomendado):**

1. Acesse: **hPanel** → **Advanced** → **Node.js**
2. Clique em **Create Node.js App**
3. Configure:
   - **Node.js Version**: `20.x` (ou 18.x)
   - **Application Mode**: `Production`
   - **Application Root**: `public_html`
   - **Application URL**: `/` (ou subdomínio)
   - **Application Startup File**: `dist-server/api/server.js`
   - **Port**: `3006`
4. Clique em **Create**

---

### 9️⃣ Iniciar Servidor (Alternativa - PM2)

**Se preferir usar PM2 via SSH:**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Ver status
pm2 status

# Ver logs
pm2 logs simconsult

# Reiniciar
pm2 restart simconsult
```

---

### 🔟 Verificar se Está Funcionando

```bash
# Verificar se o processo está rodando
ps aux | grep node

# Verificar porta
netstat -tulpn | grep 3006

# Ver logs
tail -f logs/app.log
# ou
pm2 logs simconsult
```

---

## 🔄 Comandos Úteis para Manutenção

### Atualizar Código

```bash
# Fazer backup do banco
cp data/crm_whatsapp.db data/crm_whatsapp.db.backup

# Atualizar código
git pull origin main

# Reinstalar dependências (se houver novas)
npm install --production

# Rebuild
npm run build:production

# Reiniciar
pm2 restart simconsult
# ou reinicie via hPanel
```

### Ver Logs

```bash
# Logs do servidor
tail -f logs/app.log

# Logs PM2
pm2 logs simconsult --lines 100

# Logs em tempo real
pm2 logs simconsult --lines 0
```

### Parar/Iniciar Servidor

```bash
# Parar (PM2)
pm2 stop simconsult

# Iniciar (PM2)
pm2 start ecosystem.config.js

# Reiniciar (PM2)
pm2 restart simconsult

# Parar tudo (PM2)
pm2 stop all
```

### Verificar Status

```bash
# Status PM2
pm2 status

# Informações detalhadas
pm2 info simconsult

# Monitoramento
pm2 monit
```

---

## 🐛 Troubleshooting Rápido

### Servidor não inicia

```bash
# Verificar erros
pm2 logs simconsult --err

# Verificar se porta está livre
netstat -tulpn | grep 3006

# Verificar variáveis de ambiente
cat .env
```

### Frontend não carrega

```bash
# Verificar se build foi feito
ls -la dist/

# Rebuild
npm run build
```

### Erro de permissão

```bash
# Dar permissões
chmod -R 755 dist/
chmod -R 755 dist-server/
chmod 600 .env
```

### Banco de dados não funciona

```bash
# Verificar pasta data
ls -la data/

# Dar permissões
chmod 755 data/
chmod 644 data/*.db
```

---

## ✅ Checklist Rápido

Execute estes comandos na ordem:

```bash
# 1. Conectar
ssh usuario@servidor

# 2. Ir para pasta
cd ~/public_html

# 3. Clonar/Atualizar
git clone https://github.com/thiagogitai/sinconsult.git .
# ou
git pull origin main

# 4. Instalar
npm install --production

# 5. Criar .env
cp .env.example .env
nano .env  # Editar com suas keys

# 6. Criar pastas
mkdir -p data uploads/audio uploads/images logs
chmod 755 data uploads logs

# 7. Build
npm run build:production

# 8. Configurar no hPanel (Node.js App)
# OU usar PM2:
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save

# 9. Verificar
pm2 status
pm2 logs simconsult
```

---

## 📝 Resumo dos Comandos Essenciais

```bash
# Deploy inicial
git clone https://github.com/thiagogitai/sinconsult.git .
npm install --production
cp .env.example .env && nano .env
mkdir -p data uploads/audio uploads/images logs
npm run build:production

# Iniciar (escolha um método)
# Método 1: Via hPanel (Node.js App)
# Método 2: Via PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save

# Atualizar
git pull origin main
npm install --production
npm run build:production
pm2 restart simconsult
```

---

**Pronto! Seu sistema estará no ar! 🚀**

