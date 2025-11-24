# 🔧 Configurar Nginx ou Apache

## Verificar qual servidor está instalado

```bash
# Verificar Nginx
nginx -v 2>&1 || echo "Nginx não instalado"

# Verificar Apache
apache2 -v 2>&1 || httpd -v 2>&1 || echo "Apache não instalado"

# Ver qual está rodando
systemctl status nginx || systemctl status apache2 || systemctl status httpd
```

---

## Opção 1: Instalar e Configurar Nginx

```bash
# Instalar Nginx
apt update
apt install nginx -y

# Criar diretório se não existir
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Criar configuração
nano /etc/nginx/sites-available/certcrm
```

**Cole:**

```nginx
server {
    listen 80;
    server_name certcrm.com.br www.certcrm.com.br;

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
```

**Ativar:**

```bash
ln -s /etc/nginx/sites-available/certcrm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

## Opção 2: Usar Apache (.htaccess já existe)

Se estiver usando Apache, o arquivo `.htaccess` já está configurado. Mas você precisa configurar o proxy reverso:

```bash
# Habilitar mod_proxy
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod headers

# Criar configuração
nano /etc/apache2/sites-available/certcrm.conf
```

**Cole:**

```apache
<VirtualHost *:80>
    ServerName certcrm.com.br
    ServerAlias www.certcrm.com.br

    ProxyPreserveHost On
    ProxyRequests Off

    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPass / http://localhost:3006/
    ProxyPassReverse / http://localhost:3006/

    <Location />
        Order allow,deny
        Allow from all
    </Location>
</VirtualHost>
```

**Ativar:**

```bash
a2ensite certcrm
systemctl restart apache2
```

---

## Opção 3: Acessar Diretamente pela Porta (Temporário)

Se não quiser configurar Nginx/Apache agora, pode acessar diretamente:

```bash
# Abrir porta no firewall
ufw allow 3006/tcp

# Acessar: http://certcrm.com.br:3006
# ou http://IP_DO_SERVIDOR:3006
```

---

## Configurar SSL (HTTPS)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y
# ou
apt install certbot python3-certbot-apache -y

# Obter certificado
certbot --nginx -d certcrm.com.br -d www.certcrm.com.br
# ou
certbot --apache -d certcrm.com.br -d www.certcrm.com.br
```

---

## Verificar se está funcionando

```bash
# Testar localmente
curl http://localhost:3006

# Testar externamente
curl http://certcrm.com.br

# Ver logs
pm2 logs simconsult
tail -f /var/log/nginx/error.log  # Se usar Nginx
tail -f /var/log/apache2/error.log  # Se usar Apache
```

