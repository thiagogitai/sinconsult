const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

console.log('Verificando esquema da tabela campaigns...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    const command = "sqlite3 /root/simconsult/database.sqlite 'PRAGMA table_info(campaigns);'";

    conn.exec(command, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\nVerificação finalizada.`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
}).connect(config);
