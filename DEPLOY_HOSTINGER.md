# 🚀 Guia Completo de Deploy na Hostinger

Este guia explica passo a passo como fazer o deploy do sistema Sim Consult na Hostinger.

## 📋 Pré-requisitos

1. ✅ Conta na Hostinger com acesso a Node.js
2. ✅ Acesso SSH ou File Manager
3. ✅ Domínio configurado (opcional, mas recomendado)
4. ✅ Git instalado (se usar SSH)

## 🔧 Passo 1: Preparação Local

### 1.1 Build do Projeto

```bash
# Build do frontend e backend
npm run build:production
```

Isso criará:
- `dist/` - Frontend buildado (React)
- `dist-server/` - Backend compilado (TypeScript → JavaScript)

### 1.2 Verificar Arquivos

Certifique-se de que os seguintes arquivos existem:
- ✅ `dist/` (frontend buildado)
- ✅ `dist-server/api/server.js` (servidor backend compilado)
- ✅ `.env.example` (template de variáveis de ambiente)
- ✅ `package.json` (com scripts de produção)

## 📤 Passo 2: Upload para Hostinger

### Opção A: Via File Manager (Recomendado para iniciantes)

1. Acesse o **hPanel** da Hostinger
2. Vá em **File Manager**
3. Navegue até a pasta `public_html` (ou `domains/seu-dominio.com/public_html`)
4. Faça upload de todos os arquivos do projeto, **EXCETO**:
   - ❌ `node_modules/` (será instalado no servidor)
   - ❌ `.git/`
   - ❌ Arquivos de desenvolvimento (`.ts`, `src/`, etc.)
   - ❌ `data/*.db` (banco será criado no servidor)

**Arquivos importantes para upload:**
- ✅ `dist/` (frontend)
- ✅ `dist-server/` (backend)
- ✅ `package.json`
- ✅ `.env.example`
- ✅ `.htaccess`
- ✅ `ecosystem.config.js` (se usar PM2)

### Opção B: Via SSH (Recomendado)

```bash
# 1. Conecte-se via SSH
ssh usuario@seu-servidor.hostinger.com

# 2. Navegue até a pasta do projeto
cd ~/public_html

# 3. Clone o repositório
git clone https://github.com/thiagogitai/sinconsult.git .

# 4. Ou faça upload via SCP do seu computador local:
# scp -r * usuario@seu-servidor.hostinger.com:~/public_html/
```

## ⚙️ Passo 3: Configuração no Servidor

### 3.1 Instalar Dependências

```bash
cd ~/public_html
npm install --production
```

### 3.2 Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
nano .env
# ou
vi .env
```

Cole o conteúdo abaixo e preencha com seus valores reais:

```env
# ============================================
# CONFIGURAÇÕES GERAIS
# ============================================
NODE_ENV=production
PORT=3006
FRONTEND_URL=https://seu-dominio.com

# ============================================
# SEGURANÇA
# ============================================
JWT_SECRET=sua-chave-secreta-super-segura-aqui-mude-isto

# ============================================
# EVOLUTION API (WhatsApp)
# ============================================
EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_KEY=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc

# ============================================
# TTS - OPENAI
# ============================================
OPENAI_API_KEY=sua-api-key-openai-aqui

# ============================================
# TTS - ELEVENLABS
# ============================================
ELEVENLABS_API_KEY=sua-api-key-elevenlabs-aqui

# ============================================
# SMS - ZENVIA (se usar)
# ============================================
ZENVIA_API_TOKEN=seu-token-zenvia-aqui
ZENVIA_FROM=seu-numero-zenvia-aqui

# ============================================
# EMAIL - SMTP (se usar)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app-aqui
SMTP_FROM=seu-email@gmail.com
```

**⚠️ IMPORTANTE:** 
- Substitua `seu-dominio.com` pelo seu domínio real
- Use um `JWT_SECRET` forte e único
- NUNCA commite o arquivo `.env` no Git!

### 3.3 Criar Diretórios Necessários

```bash
# Criar diretórios para dados e uploads
mkdir -p data uploads/audio uploads/images logs
chmod 755 data uploads logs
```

## 🎯 Passo 4: Configurar Node.js na Hostinger

### 4.1 Via hPanel (Método Recomendado)

1. Acesse **hPanel** → **Advanced** → **Node.js**
2. Clique em **Create Node.js App**
3. Configure:
   - **Node.js Version**: 18.x ou superior (recomendado: 20.x)
   - **Application Mode**: Production
   - **Application Root**: `public_html`
   - **Application URL**: `/` (ou subdomínio como `app.seu-dominio.com`)
   - **Application Startup File**: `dist-server/api/server.js`
   - **Port**: `3006` (ou a porta que você configurou no `.env`)

4. Clique em **Create**

### 4.2 Via SSH com PM2 (Alternativa)

Se a Hostinger permitir instalação global de pacotes:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

## 🔄 Passo 5: Configurar Proxy Reverso (Se necessário)

Se a Hostinger usar Apache e não suportar Node.js diretamente, o arquivo `.htaccess` já está configurado. Se precisar de proxy reverso, descomente as linhas no `.htaccess`:

```apache
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3006/api/$1 [P,L]
```

## 🛠️ Passo 6: Verificar Configuração

### 6.1 Verificar se o Servidor Está Rodando

```bash
# Via SSH
ps aux | grep node

# Ou via PM2
pm2 status
pm2 logs simconsult
```

### 6.2 Verificar Portas

```bash
# Verificar se a porta está em uso
netstat -tulpn | grep 3006
```

### 6.3 Verificar Logs

```bash
# Logs do servidor
tail -f ~/logs/app.log

# Ou via PM2
pm2 logs simconsult --lines 50
```

## 🔍 Passo 7: Testes

1. ✅ Acesse seu domínio: `https://seu-dominio.com`
2. ✅ Verifique se o frontend carrega
3. ✅ Teste o login
4. ✅ Teste funcionalidades principais:
   - Criar contato
   - Criar campanha
   - Enviar mensagem
   - TTS

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- ✅ Execute `npm install --production` novamente
- ✅ Verifique se está na pasta correta
- ✅ Verifique se todas as dependências estão no `package.json`

### Erro: "Port already in use"
- ✅ Verifique se outra aplicação está usando a porta
- ✅ Altere a porta no `.env` se necessário
- ✅ Pare processos antigos: `pm2 stop all` ou `killall node`

### Frontend não carrega
- ✅ Verifique se o build foi executado (`npm run build:production`)
- ✅ Verifique se a pasta `dist/` existe e tem arquivos
- ✅ Verifique as permissões: `chmod -R 755 dist/`
- ✅ Verifique o console do navegador para erros

### API não responde
- ✅ Verifique se o servidor Node.js está rodando
- ✅ Verifique as variáveis de ambiente no `.env`
- ✅ Verifique os logs de erro: `tail -f logs/app.log`
- ✅ Verifique se a porta está correta no `.env` e no hPanel

### Erro 404 em rotas do React
- ✅ Verifique se o `.htaccess` está na raiz
- ✅ Verifique se o mod_rewrite está habilitado no Apache
- ✅ Verifique se a rota catch-all está configurada no servidor

### Banco de dados não funciona
- ✅ Verifique se a pasta `data/` existe e tem permissões: `chmod 755 data`
- ✅ Verifique se o SQLite está instalado
- ✅ Verifique os logs para erros de banco

## 🔐 Segurança

1. ✅ **NUNCA** commite o arquivo `.env`
2. ✅ Use `JWT_SECRET` forte e único (mínimo 32 caracteres aleatórios)
3. ✅ Configure HTTPS (SSL) na Hostinger
4. ✅ Mantenha as dependências atualizadas: `npm audit fix`
5. ✅ Use firewall se disponível
6. ✅ Configure permissões corretas: `chmod 600 .env`

## 📝 Scripts Úteis

```bash
# Build completo
npm run build:production

# Iniciar servidor
npm start

# Ver logs
tail -f logs/app.log

# Reiniciar aplicação (PM2)
pm2 restart simconsult

# Parar aplicação (PM2)
pm2 stop simconsult

# Status (PM2)
pm2 status
```

## 🔄 Atualizações Futuras

Para atualizar o sistema:

```bash
# 1. Fazer backup do banco de dados
cp data/crm_whatsapp.db data/crm_whatsapp.db.backup

# 2. Atualizar código
git pull origin main

# 3. Instalar novas dependências
npm install --production

# 4. Rebuild
npm run build:production

# 5. Reiniciar
pm2 restart simconsult
# ou reinicie via hPanel
```

## 📞 Suporte

- 📚 Documentação Hostinger: https://support.hostinger.com
- 📋 Logs do sistema: `~/logs/` ou via PM2
- 🔍 Verificar status: `pm2 status` ou via hPanel
- 🐛 Issues no GitHub: https://github.com/thiagogitai/sinconsult/issues

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Build do frontend executado (`dist/` existe)
- [ ] Build do backend executado (`dist-server/` existe)
- [ ] Arquivo `.env` configurado com valores reais
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Node.js app criado no hPanel
- [ ] Diretórios criados (`data/`, `uploads/`, `logs/`)
- [ ] Permissões configuradas
- [ ] Servidor rodando e acessível
- [ ] SSL/HTTPS configurado
- [ ] Testes realizados (login, funcionalidades)
- [ ] Logs verificados (sem erros críticos)
- [ ] Backup do banco de dados configurado

---

**Boa sorte com o deploy! 🚀**

Se encontrar problemas, verifique os logs primeiro e consulte a seção de Troubleshooting acima.
