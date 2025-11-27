const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

console.log('Corrigindo logo e permissões...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    // Comandos para garantir que a logo esteja no lugar certo e acessível
    const commands = [
        // Garantir que diretórios existem
        'mkdir -p /root/simconsult/public',
        'mkdir -p /root/simconsult/dist',

        // Copiar logo para ambos os locais possíveis
        'cp /root/simconsult/public/logo.png /root/simconsult/dist/logo.png',

        // Ajustar permissões
        'chmod -R 755 /root/simconsult/public',
        'chmod -R 755 /root/simconsult/dist',
        'chmod 644 /root/simconsult/public/logo.png',
        'chmod 644 /root/simconsult/dist/logo.png',

        // Listar para confirmar
        'ls -la /root/simconsult/public/logo.png',
        'ls -la /root/simconsult/dist/logo.png'
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\nCorreção finalizada com código: ${code}`);
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
