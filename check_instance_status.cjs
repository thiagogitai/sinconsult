const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

console.log('Verificando status da instância e testando envio direto...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    const commands = [
        'cd /root/simconsult',
        'echo "=== Verificando instâncias no banco ==="',
        'sqlite3 database.sqlite "SELECT instance_id, name, status, phone_connected FROM whatsapp_instances;"',
        'echo "\n=== Verificando contato teste1 ==="',
        'sqlite3 database.sqlite "SELECT id, name, phone, segment FROM contacts WHERE segment = \'teste1\';"',
        'echo "\n=== Verificando campanhas recentes ==="',
        'sqlite3 database.sqlite "SELECT id, name, message_type, status, target_segment FROM campaigns WHERE target_segment = \'teste1\' ORDER BY created_at DESC LIMIT 5;"'
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
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
