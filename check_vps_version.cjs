const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    'cd ~/simconsult',
    'git log --oneline -5',
    'grep -n "audio_upload" api/server.ts || echo "audio_upload não encontrado"',
    'grep -n "Body recebido" api/server.ts || echo "Body recebido não encontrado"'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Verificando versão do código no VPS...\n');

    const commandString = commands.join(' && ');

    conn.exec(commandString, (err, stream) => {
        if (err) throw err;

        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect(config);
