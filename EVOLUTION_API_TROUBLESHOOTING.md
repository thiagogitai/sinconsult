# 🔧 Troubleshooting - Evolution API

## Problemas Comuns e Soluções

### 1. ❌ "Evolution API não está acessível"

**Causa**: O servidor da Evolution API não está rodando ou a URL está incorreta.

**Solução**:
1. Verifique se a Evolution API está rodando:
   ```bash
   # Verificar se a porta 8080 está em uso
   netstat -ano | findstr :8080
   ```

2. Verifique a URL no arquivo `.env`:
   ```env
   EVOLUTION_API_URL=http://localhost:8080
   ```

3. Se a Evolution API estiver em outro servidor, ajuste a URL:
   ```env
   EVOLUTION_API_URL=http://seu-servidor:8080
   ```

4. Teste a conexão manualmente:
   ```bash
   curl http://localhost:8080/
   ```

---

### 2. ❌ "Erro de autenticação na Evolution API"

**Causa**: A API_KEY não está configurada ou está incorreta.

**Solução**:
1. Verifique se `EVOLUTION_API_KEY` está no arquivo `.env`:
   ```env
   EVOLUTION_API_KEY=sua-chave-aqui
   ```

2. Verifique se a chave está correta na Evolution API

3. Algumas versões da Evolution API usam `Authorization: Bearer` ao invés de `apikey`. O código já suporta ambos.

---

### 3. ❌ "Endpoint não encontrado"

**Causa**: A versão da Evolution API pode ter endpoints diferentes.

**Solução**:
1. Verifique a documentação da sua versão da Evolution API
2. Os endpoints padrão são:
   - `POST /instance/create` - Criar instância
   - `POST /instance/connect/{name}` - Conectar instância
   - `GET /instance/connectionState/{name}` - Status da conexão
   - `POST /message/sendText/{name}` - Enviar texto
   - `POST /message/sendImage/{name}` - Enviar imagem
   - `POST /message/sendAudio/{name}` - Enviar áudio
   - `POST /message/sendVideo/{name}` - Enviar vídeo

---

### 4. ❌ "ECONNREFUSED" ou "ETIMEDOUT"

**Causa**: O servidor da Evolution API não está respondendo.

**Solução**:
1. **Verifique se a Evolution API está instalada e rodando**:
   ```bash
   # Docker
   docker ps | grep evolution
   
   # Ou verifique os logs
   docker logs evolution-api
   ```

2. **Verifique o firewall**:
   - Certifique-se de que a porta 8080 está aberta
   - Se estiver em servidor remoto, verifique as regras de firewall

3. **Verifique a rede**:
   - Se estiver usando Docker, verifique se os containers estão na mesma rede
   - Se estiver em servidor remoto, verifique conectividade

---

### 5. ❌ Erros ao criar instância

**Causa**: Pode ser problema com o nome da instância ou configuração.

**Solução**:
1. Verifique se o nome da instância é único
2. Verifique os logs da Evolution API para mais detalhes
3. Alguns caracteres especiais podem causar problemas - use apenas letras, números e hífens

---

## ✅ Verificação Rápida

Execute este comando para verificar a configuração:

```bash
# No diretório do projeto
node -e "
require('dotenv').config();
console.log('EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL || 'NÃO CONFIGURADO');
console.log('EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
"
```

---

## 📋 Checklist de Configuração

- [ ] Evolution API está instalada e rodando
- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] `EVOLUTION_API_URL` está configurado corretamente
- [ ] `EVOLUTION_API_KEY` está configurado corretamente
- [ ] Porta 8080 (ou a porta configurada) está acessível
- [ ] Firewall permite conexões na porta
- [ ] Servidor Node.js consegue acessar a Evolution API

---

## 🔍 Logs e Debug

Para ver logs detalhados, verifique:

1. **Logs do servidor Node.js**: 
   - Arquivos em `logs/` (criados automaticamente)
   - Console do servidor

2. **Logs da Evolution API**:
   - Se estiver usando Docker: `docker logs evolution-api`
   - Se estiver rodando diretamente: verifique o console onde iniciou

3. **Ative modo debug** (se necessário):
   ```env
   NODE_ENV=development
   ```

---

## 🆘 Ainda com Problemas?

1. Verifique a versão da Evolution API que está usando
2. Consulte a documentação oficial da Evolution API
3. Verifique se há atualizações disponíveis
4. Teste a API diretamente com curl ou Postman

---

## 📝 Exemplo de Configuração Correta

```env
# .env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=minha-chave-secreta-aqui
```

---

**Última atualização**: 2025-01-27

