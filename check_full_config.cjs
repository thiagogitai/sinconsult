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
    console.log('🔍 Procurando configuração do certcrm.com.br...\n');

    conn.exec('grep -r "certcrm" /etc/nginx/ 2>/dev/null', (err, stream) => {
        stream.on('close', (code) => {
            if (code !== 0) {
                console.log('\n⚠️  Nenhuma configuração específica encontrada. Verificando default...\n');
            }

            conn.exec('cat /etc/nginx/sites-enabled/* 2>/dev/null | head -100', (err, stream2) => {
                stream2.on('close', () => {
                    console.log('\n📊 Verificando processos PM2 e portas...\n');

                    conn.exec('pm2 list && netstat -tlnp | grep :3006', (err, stream3) => {
                        stream3.on('close', () => {
                            conn.end();
                        }).on('data', (data) => {
                            console.log(data.toString());
                        });
                    });
                }).on('data', (data) => {
                    console.log(data.toString());
                });
            });
        }).on('data', (data) => {
            console.log(data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
