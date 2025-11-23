# 🚀 Deploy na Hostinger SEM Node.js

Como a Hostinger não tem Node.js, vamos usar uma solução híbrida:
- **Frontend**: Hostinger (site estático)
- **Backend**: Serviço externo (Vercel, Railway, Render, etc.)

---

## 📋 Opção 1: Frontend na Hostinger + Backend no Vercel (Recomendado)

### Passo 1: Deploy do Backend no Vercel

1. **Criar conta no Vercel**: https://vercel.com

2. **Conectar repositório GitHub**:
   - Vercel Dashboard → Add New Project
   - Importar: `https://github.com/thiagogitai/sinconsult`

3. **Configurar Build Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:server`
   - **Output Directory**: `dist-server`
   - **Install Command**: `npm install`

4. **Configurar Variáveis de Ambiente no Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Adicione todas as variáveis do `.env.example`:
     ```
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=sua-chave-secreta
     EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
     EVOLUTION_API_KEY=sua-key
     OPENAI_API_KEY=sua-key
     ELEVENLABS_API_KEY=sua-key
     ```

5. **Criar arquivo `vercel.json` na raiz**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "api/server.ts"
       }
     ]
   }
   ```

6. **Deploy**: Vercel fará o deploy automaticamente

7. **Anotar a URL do backend**: Ex: `https://seu-projeto.vercel.app`

---

### Passo 2: Configurar Frontend para usar Backend do Vercel

1. **Criar arquivo `.env.production` na raiz**:
   ```env
   VITE_API_URL=https://seu-projeto.vercel.app/api
   ```

2. **Build do frontend localmente**:
   ```bash
   npm run build
   ```

3. **Upload para Hostinger**:
   - Via File Manager do hPanel
   - Upload apenas a pasta `dist/` e o arquivo `.htaccess`

---

## 📋 Opção 2: Frontend na Hostinger + Backend no Railway

### Passo 1: Deploy do Backend no Railway

1. **Criar conta**: https://railway.app

2. **New Project → Deploy from GitHub repo**

3. **Selecionar repositório**: `thiagogitai/sinconsult`

4. **Configurar**:
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:server`
   - **Start Command**: `node dist-server/api/server.js`

5. **Adicionar variáveis de ambiente** no Railway Dashboard

6. **Deploy**: Railway fará automaticamente

7. **Anotar URL**: Ex: `https://seu-projeto.railway.app`

---

### Passo 2: Configurar Frontend

Mesmo processo da Opção 1, mas usando a URL do Railway.

---

## 📋 Opção 3: Frontend na Hostinger + Backend no Render

### Passo 1: Deploy do Backend no Render

1. **Criar conta**: https://render.com

2. **New → Web Service**

3. **Connect GitHub** e selecionar repositório

4. **Configurar**:
   - **Name**: `simconsult-api`
   - **Environment**: `Node`
   - **Build Command**: `npm run build:server`
   - **Start Command**: `node dist-server/api/server.js`

5. **Adicionar variáveis de ambiente**

6. **Deploy**

---

## 📋 Opção 4: Apenas Frontend (Sem Backend)

Se você não precisa do backend rodando, pode usar apenas o frontend estático:

1. **Build do frontend**:
   ```bash
   npm run build
   ```

2. **Upload `dist/` para Hostinger**

3. **O frontend funcionará, mas sem funcionalidades de backend**

---

## 🔧 Configuração do Frontend

### Atualizar `src/services/api.ts`

O arquivo já está configurado para detectar automaticamente a URL da API. Você só precisa:

1. **Criar arquivo `.env.production`**:
   ```env
   VITE_API_URL=https://seu-backend.vercel.app/api
   ```

2. **Ou configurar via variável de ambiente no build**:
   ```bash
   VITE_API_URL=https://seu-backend.vercel.app/api npm run build
   ```

---

## 📤 Upload para Hostinger (Apenas Frontend)

### Via File Manager

1. Acesse **hPanel → File Manager**
2. Vá para `public_html`
3. Faça upload de:
   - Toda a pasta `dist/` (conteúdo da pasta, não a pasta em si)
   - Arquivo `.htaccess`

### Via FTP

```bash
# Usando FileZilla ou similar
# Conectar ao servidor FTP da Hostinger
# Upload da pasta dist/ para public_html/
```

### Estrutura Final na Hostinger

```
public_html/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
├── logo.png
├── background.png
└── .htaccess
```

---

## ✅ Checklist

- [ ] Backend deployado (Vercel/Railway/Render)
- [ ] URL do backend anotada
- [ ] `.env.production` criado com `VITE_API_URL`
- [ ] Frontend buildado (`npm run build`)
- [ ] Pasta `dist/` enviada para Hostinger
- [ ] `.htaccess` enviado para Hostinger
- [ ] Testar acesso ao site
- [ ] Testar login e funcionalidades

---

## 🐛 Troubleshooting

### Frontend não conecta com backend

- Verifique se `VITE_API_URL` está correto no `.env.production`
- Verifique CORS no backend (já configurado)
- Verifique console do navegador para erros

### Erro 404 nas rotas do React

- Verifique se `.htaccess` está na raiz do `public_html`
- Verifique se mod_rewrite está habilitado

### Backend não responde

- Verifique logs no Vercel/Railway/Render
- Verifique variáveis de ambiente
- Verifique se o deploy foi bem-sucedido

---

## 🎯 Recomendação

**Use Vercel para o backend** - É gratuito, fácil de configurar e tem deploy automático do GitHub.

**Passos rápidos Vercel:**
1. Conectar GitHub
2. Importar projeto
3. Configurar variáveis de ambiente
4. Deploy automático
5. Copiar URL e usar no frontend

---

**Pronto! Frontend na Hostinger + Backend no Vercel! 🚀**

