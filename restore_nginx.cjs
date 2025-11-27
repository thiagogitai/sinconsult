const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

// Configuração correta do Nginx
const nginxConfig = `server {
    listen 80;
    server_name certcrm.com.br www.certcrm.com.br;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name certcrm.com.br www.certcrm.com.br;

    ssl_certificate /etc/letsencrypt/live/certcrm.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certcrm.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
`;

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado! Restaurando configuração do Nginx...\n');

    // Enviar arquivo via SFTP
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const remotePath = '/etc/nginx/sites-available/certcrm';
        const writeStream = sftp.createWriteStream(remotePath);

        writeStream.on('close', () => {
            console.log('✅ Arquivo enviado!');

            // Testar e recarregar
            conn.exec('nginx -t && systemctl reload nginx && echo "✅ Nginx OK - Limite: 100MB"', (err, stream) => {
                if (err) throw err;

                stream.on('close', () => {
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        });

        writeStream.write(nginxConfig);
        writeStream.end();
    });
}).connect(config);
