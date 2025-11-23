# 🚀 Comandos Rápidos - Hostinger SEM Node.js

## 📋 Solução: Frontend na Hostinger + Backend no Vercel

---

## 1️⃣ Deploy do Backend no Vercel

### Via Interface Web (Mais Fácil)

1. Acesse: https://vercel.com
2. **Sign Up** com GitHub
3. **Add New Project**
4. **Import Git Repository**: `thiagogitai/sinconsult`
5. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: `npm run build:server`
   - Output Directory: `dist-server`
   - Install Command: `npm install`
6. **Environment Variables** (adicionar todas):
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=sua-chave-secreta-forte
   FRONTEND_URL=https://seu-dominio.com
   EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
   EVOLUTION_API_KEY=sua-key-evolution
   OPENAI_API_KEY=sua-key-openai
   ELEVENLABS_API_KEY=sua-key-elevenlabs
   ZENVIA_API_TOKEN=sua-key-zenvia
   ZENVIA_FROM=seu-numero
   ```
7. **Deploy**
8. **Copiar URL**: Ex: `https://simconsult.vercel.app`

---

## 2️⃣ Preparar Frontend Localmente

```bash
# No seu computador
cd C:\xampp\htdocs\sim\Sim

# Criar arquivo .env.production
echo VITE_API_URL=https://seu-projeto.vercel.app/api > .env.production

# Editar e colar a URL real do Vercel
notepad .env.production

# Build do frontend
npm run build
```

**Conteúdo do `.env.production`:**
```env
VITE_API_URL=https://seu-projeto.vercel.app/api
```

---

## 3️⃣ Upload para Hostinger

### Opção A: Via File Manager (Recomendado)

1. Acesse **hPanel → File Manager**
2. Vá para `public_html`
3. **Upload**:
   - Todo o conteúdo da pasta `dist/` (não a pasta, mas os arquivos dentro)
   - Arquivo `.htaccess`

### Opção B: Via FTP

```bash
# Usar FileZilla, WinSCP ou similar
# Conectar ao FTP da Hostinger
# Upload da pasta dist/ para public_html/
```

### Estrutura na Hostinger

```
public_html/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── logo.png
├── background.png
└── .htaccess
```

---

## 4️⃣ Verificar Funcionamento

1. Acesse: `https://seu-dominio.com`
2. Abra **Console do Navegador** (F12)
3. Verifique se não há erros de CORS
4. Teste login

---

## 🔄 Atualizar Frontend

```bash
# Localmente
npm run build

# Upload nova pasta dist/ para Hostinger
# (substituir arquivos antigos)
```

---

## 🔄 Atualizar Backend

O Vercel atualiza automaticamente quando você faz push no GitHub:

```bash
git push origin main
# Vercel detecta e faz deploy automático
```

---

## ✅ Checklist Rápido

```bash
# 1. Backend no Vercel
# ✅ Criar projeto no Vercel
# ✅ Adicionar variáveis de ambiente
# ✅ Deploy
# ✅ Copiar URL

# 2. Frontend local
# ✅ Criar .env.production com URL do Vercel
# ✅ npm run build

# 3. Upload Hostinger
# ✅ Upload dist/ para public_html/
# ✅ Upload .htaccess

# 4. Testar
# ✅ Acessar site
# ✅ Testar login
```

---

## 🎯 Resumo dos Comandos

```bash
# 1. Criar .env.production
echo VITE_API_URL=https://seu-projeto.vercel.app/api > .env.production

# 2. Build
npm run build

# 3. Upload dist/ para Hostinger (via File Manager ou FTP)
```

---

**Pronto! Frontend estático na Hostinger + Backend no Vercel! 🚀**

