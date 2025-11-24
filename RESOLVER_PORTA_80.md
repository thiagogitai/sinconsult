# 🔧 Resolver Conflito de Porta 80

## Verificar o que está usando a porta 80

```bash
# Ver qual processo está na porta 80
netstat -tulpn | grep :80
# ou
ss -tulpn | grep :80
# ou
lsof -i :80

# Ver status dos servidores web
systemctl status nginx
systemctl status apache2
systemctl status httpd
```

---

## Opção 1: Parar Apache (se estiver rodando)

```bash
# Parar Apache
systemctl stop apache2
systemctl disable apache2

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx
```

---

## Opção 2: Usar Apache ao invés de Nginx

Se preferir usar Apache:

```bash
# Parar Nginx
systemctl stop nginx
systemctl disable nginx

# Instalar módulos do Apache
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

## Opção 3: Usar Porta Diferente no Nginx

Se quiser manter ambos:

```bash
# Editar configuração do Nginx para usar porta 8080
nano /etc/nginx/sites-available/certcrm
```

**Altere para:**

```nginx
server {
    listen 8080;
    server_name certcrm.com.br www.certcrm.com.br;
    # ... resto igual
}
```

---

## Opção 4: Acessar Diretamente pela Porta 3006 (Mais Simples)

Já que a porta 3006 está aberta, você pode acessar diretamente:

- **URL:** `http://certcrm.com.br:3006`
- **ou:** `http://IP_DO_SERVIDOR:3006`

**Configurar redirecionamento no painel da Hostinger:**
- Acesse o painel da Hostinger
- Vá em **Domínios** → **certcrm.com.br**
- Configure redirecionamento de porta ou subdomínio

---

## Verificar Logs de Erro

```bash
# Ver erro do Nginx
systemctl status nginx.service
journalctl -xeu nginx.service

# Ver o que está na porta 80
netstat -tulpn | grep :80
```

