#!/bin/bash

# Instalar Certbot
apt update
apt install certbot python3-certbot-nginx -y

# Parar Nginx temporariamente
systemctl stop nginx

# Obter certificado SSL
certbot certonly --standalone -d certcrm.com.br -d www.certcrm.com.br --non-interactive --agree-tos --email admin@certcrm.com.br

# Configurar Nginx para SSL
cat > /etc/nginx/sites-available/certcrm << 'EOF'
server {
    listen 80;
    server_name certcrm.com.br www.certcrm.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name certcrm.com.br www.certcrm.com.br;
    
    ssl_certificate /etc/letsencrypt/live/certcrm.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certcrm.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
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
EOF

# Remover default se existir
rm -f /etc/nginx/sites-enabled/default

# Ativar site
ln -sf /etc/nginx/sites-available/certcrm /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl start nginx
systemctl reload nginx

# Configurar renovação automática
systemctl enable certbot.timer
systemctl start certbot.timer

echo "SSL configurado com sucesso!"


