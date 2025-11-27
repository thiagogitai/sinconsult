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

    // Verificar se o arquivo server.ts contém a rota delete
    conn.exec('grep -n "app.delete" /root/simconsult/api/server.ts', (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\nGrep finalizado com código: ${code}`);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
}).connect(config);
