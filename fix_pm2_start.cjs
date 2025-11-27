const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    'cd ~/simconsult',
    'pm2 start dist-server/api/server.js --name simconsult',
    'pm2 save',
    'pm2 list'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Iniciando PM2 com caminho correto...\n');

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
