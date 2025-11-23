# 🚀 Guia de Deploy na Hostinger

Este guia explica como fazer o deploy do sistema Sim Consult na Hostinger.

## 📋 Pré-requisitos

1. Conta na Hostinger com acesso a Node.js
2. Acesso SSH ou File Manager
3. Domínio configurado (opcional, mas recomendado)

## 🔧 Passo 1: Preparação Local

### 1.1 Build do Frontend

```bash
npm run build
```

Isso criará a pasta `dist/` com os arquivos estáticos do frontend.

### 1.2 Verificar Arquivos

Certifique-se de que os seguintes arquivos existem:
- `dist/` (frontend buildado)
- `api/server.ts` (servidor backend)
- `.env` (variáveis de ambiente - NÃO commitar!)

## 📤 Passo 2: Upload para Hostinger

### Opção A: Via File Manager (Recomendado para iniciantes)

1. Acesse o **hPanel** da Hostinger
2. Vá em **File Manager**
3. Navegue até a pasta `public_html` (ou `domains/seu-dominio.com/public_html`)
4. Faça upload de todos os arquivos do projeto, exceto:
   - `node_modules/`
   - `.git/`
   - Arquivos de desenvolvimento

### Opção B: Via SSH (Recomendado)

```bash
# Conecte-se via SSH
ssh usuario@seu-servidor.hostinger.com

# Navegue até a pasta do projeto
cd public_html

# Clone o repositório (ou faça upload via SCP)
git clone https://github.com/thiagogitai/sinconsult.git .

# Ou faça upload via SCP do seu computador local:
scp -r * usuario@seu-servidor.hostinger.com:~/public_html/
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
```

Cole o conteúdo do `.env.example` e preencha com seus valores reais:

```env
NODE_ENV=production
PORT=3006
FRONTEND_URL=https://seu-dominio.com

JWT_SECRET=sua-chave-secreta-super-segura-aqui

EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_KEY=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc

OPENAI_API_KEY=sua-api-key-openai
ELEVENLABS_API_KEY=sua-api-key-elevenlabs

# Adicione outras variáveis conforme necessário
```

### 3.3 Build do Frontend

```bash
npm run build
```

## 🎯 Passo 4: Configurar Node.js na Hostinger

### 4.1 Via hPanel

1. Acesse **hPanel** → **Advanced** → **Node.js**
2. Clique em **Create Node.js App**
3. Configure:
   - **Node.js Version**: 18.x ou superior
   - **Application Mode**: Production
   - **Application Root**: `public_html`
   - **Application URL**: `/` (ou subdomínio)
   - **Application Startup File**: `api/server.js` (ou `api/server.ts` se usar tsx)

### 4.2 Via SSH (Alternativa)

Se a Hostinger permitir, você pode usar PM2:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start api/server.ts --name simconsult --interpreter tsx

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

## 🔄 Passo 5: Configurar Proxy Reverso (Se necessário)

Se a Hostinger usar Apache, crie/edite o arquivo `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Proxy para API
  RewriteCond %{REQUEST_URI} ^/api/(.*)$
  RewriteRule ^api/(.*)$ http://localhost:3006/api/$1 [P,L]
  
  # Servir arquivos estáticos do frontend
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

## 🛠️ Passo 6: Ajustar Código para Produção

O servidor já está configurado para servir arquivos estáticos. Verifique se o `api/server.ts` tem:

```typescript
// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../dist')));
```

## 📝 Passo 7: Scripts Úteis

Adicione ao `package.json`:

```json
{
  "scripts": {
    "start": "node api/server.js",
    "start:ts": "tsx api/server.ts",
    "build": "tsc -b && vite build",
    "build:server": "tsc api/server.ts --outDir dist-server --module esnext --target es2020",
    "postinstall": "npm run build"
  }
}
```

## 🔍 Passo 8: Verificação

1. Acesse seu domínio: `https://seu-dominio.com`
2. Verifique se o frontend carrega
3. Teste o login
4. Verifique os logs:

```bash
# Via SSH
tail -f ~/logs/app.log

# Ou via PM2
pm2 logs simconsult
```

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se `npm install` foi executado
- Verifique se está na pasta correta

### Erro: "Port already in use"
- Verifique se outra aplicação está usando a porta 3006
- Altere a porta no `.env` se necessário

### Frontend não carrega
- Verifique se o build foi executado (`npm run build`)
- Verifique se a pasta `dist/` existe
- Verifique as permissões dos arquivos

### API não responde
- Verifique se o servidor Node.js está rodando
- Verifique as variáveis de ambiente
- Verifique os logs de erro

## 🔐 Segurança

1. **NUNCA** commite o arquivo `.env`
2. Use `JWT_SECRET` forte e único
3. Configure HTTPS (SSL) na Hostinger
4. Mantenha as dependências atualizadas
5. Use firewall se disponível

## 📞 Suporte

- Documentação Hostinger: https://support.hostinger.com
- Logs do sistema: `~/logs/` ou via PM2
- Verificar status: `pm2 status`

## ✅ Checklist Final

- [ ] Build do frontend executado
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Node.js app criado no hPanel
- [ ] Servidor rodando e acessível
- [ ] SSL/HTTPS configurado
- [ ] Testes realizados (login, funcionalidades)
- [ ] Logs verificados

---

**Boa sorte com o deploy! 🚀**

