const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!\n');
    console.log('🔍 Verificando configuração do Nginx...\n');

    conn.exec('cat /etc/nginx/sites-enabled/simconsult 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/nginx.conf | grep -A 30 "server {"', (err, stream) => {
        if (err) {
            console.log('❌ Erro:', err);
            conn.end();
            return;
        }

        stream.on('close', () => {
            console.log('\n📁 Verificando onde o Nginx está servindo arquivos...\n');

            conn.exec('ls -la /var/www/html/ 2>/dev/null || ls -la /usr/share/nginx/html/ 2>/dev/null', (err, stream2) => {
                stream2.on('close', () => {
                    conn.end();
                }).on('data', (data) => {
                    console.log(data.toString());
                });
            });
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.log('STDERR:', data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
