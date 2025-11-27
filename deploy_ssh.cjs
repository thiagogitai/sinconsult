const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    'cd ~/simconsult',
    'echo "=== Atualizando código ==="',
    'git fetch origin',
    'git pull --rebase origin main',
    'git status',
    'echo "=== Instalando dependências ==="',
    'npm install',
    'echo "=== Compilando Backend ==="',
    'npm run build:server',
    'echo "=== Compilando Frontend ==="',
    'npm run build:frontend',
    'echo "=== Reiniciando Servidor ==="',
    'pm2 restart simconsult || pm2 start dist-server/api/server.js --name simconsult',
    'pm2 save',
    'echo "=== Status ==="',
    'pm2 status simconsult'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    // Executar comandos em sequência
    const commandString = commands.join(' && ');

    conn.exec(commandString, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\nProcesso finalizado com código: ${code}`);
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
