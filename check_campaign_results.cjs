const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

console.log('Verificando status final das campanhas...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    const command = `
        cd /root/simconsult && 
        echo "=== CAMPANHAS RECENTES ===" && 
        sqlite3 database.sqlite "SELECT id, name, message_type, status FROM campaigns WHERE target_segment = 'teste1' ORDER BY created_at DESC LIMIT 10;" &&
        echo "" &&
        echo "=== MENSAGENS ENVIADAS ===" &&
        sqlite3 database.sqlite "SELECT m.id, m.message_type, m.status, m.error_message, c.name FROM messages m JOIN contacts c ON m.contact_id = c.id WHERE c.segment = 'teste1' ORDER BY m.created_at DESC LIMIT 10;"
    `;

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
