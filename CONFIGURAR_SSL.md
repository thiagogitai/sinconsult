# 🔒 Configurar SSL (HTTPS) no VPS

## Problema
O site não está com SSL funcionando (HTTPS).

## Solução - Configurar Certbot

Execute estes comandos no VPS:

```bash
# 1. Instalar Certbot
apt update
apt install certbot python3-certbot-nginx -y

# 2. Parar Nginx temporariamente (se necessário)
systemctl stop nginx

# 3. Obter certificado SSL
certbot certonly --standalone -d certcrm.com.br -d www.certcrm.com.br

# 4. Configurar Nginx para usar SSL
nano /etc/nginx/sites-available/certcrm
```

## Configuração do Nginx com SSL

Cole esta configuração no arquivo `/etc/nginx/sites-available/certcrm`:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name certcrm.com.br www.certcrm.com.br;
    
    # Redirecionar tudo para HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name certcrm.com.br www.certcrm.com.br;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/certcrm.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certcrm.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Tamanho máximo de upload
    client_max_body_size 50M;

    # Proxy para Node.js
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Arquivos estáticos
    location /assets/ {
        proxy_pass http://localhost:3006;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Após Configurar

```bash
# 1. Testar configuração do Nginx
nginx -t

# 2. Recarregar Nginx
systemctl reload nginx

# 3. Verificar status
systemctl status nginx

# 4. Verificar certificado
certbot certificates

# 5. Testar SSL
curl -I https://certcrm.com.br
```

## Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run

# Certbot já configura renovação automática via cron
# Verificar:
cat /etc/cron.d/certbot
```

## Se o Certbot Falhar

```bash
# Verificar se a porta 80 está livre
netstat -tlnp | grep :80

# Se estiver em uso, parar o serviço
systemctl stop docker  # Se for Docker
# OU
systemctl stop apache2  # Se for Apache

# Tentar novamente
certbot certonly --standalone -d certcrm.com.br
```

## Verificar DNS

Certifique-se de que o DNS está apontando corretamente:

```bash
# Verificar DNS
nslookup certcrm.com.br
dig certcrm.com.br

# Deve apontar para o IP do seu VPS
```

## Comando Rápido Completo

```bash
# Instalar e configurar SSL
apt update && \
apt install certbot python3-certbot-nginx -y && \
certbot certonly --standalone -d certcrm.com.br -d www.certcrm.com.br && \
systemctl reload nginx && \
echo "SSL configurado! Acesse https://certcrm.com.br"
```

