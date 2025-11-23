# 🔧 Correções para Deploy no Servidor

## ❌ Problemas Encontrados

1. **TypeScript não encontrado** - `tsc: not found`
2. **ecosystem.config.js com erro** - Precisa usar ES modules

## ✅ Soluções

### 1. Instalar Dependências de Desenvolvimento

```bash
cd ~/simconsult

# Instalar TODAS as dependências (incluindo devDependencies)
npm install

# OU instalar TypeScript globalmente
npm install -g typescript tsx
```

### 2. Build do Projeto

```bash
# Build completo
npm run build:production

# Se der erro, fazer separado:
npm run build          # Frontend
npm run build:server   # Backend
```

### 3. Verificar se Build Funcionou

```bash
# Verificar se arquivos foram criados
ls -la dist/
ls -la dist-server/api/server.js
```

### 4. Iniciar com PM2

```bash
# Agora o ecosystem.config.js está corrigido
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs simconsult
```

---

## 🚀 Comandos Completos (Execute na Ordem)

```bash
# 1. Ir para pasta do projeto
cd ~/simconsult

# 2. Instalar TODAS as dependências
npm install

# 3. Criar arquivo .env
cp .env.example .env
nano .env  # Editar com suas API keys

# 4. Criar pastas
mkdir -p data uploads/audio uploads/images logs
chmod 755 data uploads logs
chmod 600 .env

# 5. Build
npm run build:production

# 6. Verificar build
ls -la dist/
ls -la dist-server/api/server.js

# 7. Iniciar PM2
pm2 start ecosystem.config.js
pm2 save

# 8. Ver logs
pm2 logs simconsult
```

---

## 🐛 Se Ainda Der Erro

### Erro: TypeScript não encontrado

```bash
# Instalar TypeScript globalmente
npm install -g typescript

# OU instalar localmente
npm install --save-dev typescript

# Verificar
tsc --version
```

### Erro: Vite não encontrado

```bash
# Instalar Vite
npm install --save-dev vite

# OU instalar todas devDependencies
npm install
```

### Erro: PM2 ecosystem.config.js

O arquivo já foi corrigido para usar ES modules. Se ainda der erro:

```bash
# Iniciar manualmente sem ecosystem.config.js
pm2 start dist-server/api/server.js --name simconsult

# OU criar arquivo .cjs
mv ecosystem.config.js ecosystem.config.cjs
pm2 start ecosystem.config.cjs
```

---

## ✅ Verificar se Está Funcionando

```bash
# Verificar se PM2 está rodando
pm2 status

# Ver logs
pm2 logs simconsult --lines 50

# Testar API
curl http://localhost:3006/api/health

# Ver processos
ps aux | grep node
```

---

**Execute os comandos acima e me avise se funcionou! 🚀**

