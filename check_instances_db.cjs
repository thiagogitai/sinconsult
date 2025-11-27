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
    console.log('📋 Verificando banco de dados...\n');

    conn.exec('cd /root/simconsult && sqlite3 database.sqlite "SELECT id, name, instance_id, status, phone_connected FROM whatsapp_instances WHERE is_active = 1 OR is_active IS NULL;"', (err, stream) => {
        if (err) {
            console.log('❌ Erro:', err);
            conn.end();
            return;
        }

        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log('INSTÂNCIAS:');
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.log('STDERR:', data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
