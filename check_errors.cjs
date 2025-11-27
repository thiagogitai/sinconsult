const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');
    console.log('📋 Verificando logs de erro...\n');

    conn.exec('pm2 logs simconsult --err --lines 50 --nostream', (err, stream) => {
        if (err) {
            console.log('❌ Erro:', err);
            conn.end();
            return;
        }

        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.log('STDERR:', data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
