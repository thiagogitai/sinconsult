const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

console.log('Lendo configurações remotas...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    const commands = [
        'echo "=== NGINX CONFIG ==="',
        'cat /etc/nginx/sites-enabled/default',
        'echo "\n=== SERVER.TS (Campaign Queue) ==="',
        'grep -A 20 "async function processCampaignWithQueue" /root/simconsult/api/server.ts',
        'echo "\n=== SERVER.TS (Delete Campaign) ==="',
        'grep -A 10 "app.delete.*campaigns" /root/simconsult/api/server.ts'
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\nLeitura finalizada.`);
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
