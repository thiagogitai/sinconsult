const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    'ls -la ~/simconsult/public/logo-sim-consult.svg',
    'ls -la ~/simconsult/dist/logo-sim-consult.svg'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Verificando logo no VPS...\n');

    const commandString = commands.join(' ; '); // Usar ; para executar o segundo mesmo se o primeiro falhar

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
