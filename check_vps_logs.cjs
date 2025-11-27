const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    'pm2 logs simconsult --lines 100 --nostream'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS! Buscando logs...');

    const commandString = commands.join(' && ');

    conn.exec(commandString, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
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
