const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    // Fazer backup
    'cp /etc/nginx/sites-available/certcrm /etc/nginx/sites-available/certcrm.backup',

    // Adicionar client_max_body_size usando sed
    'sed -i "/ssl_prefer_server_ciphers on;/a\\\\\\n    # Aumentar limite de upload para 100MB\\n    client_max_body_size 100M;" /etc/nginx/sites-available/certcrm',

    // Testar configuração
    'nginx -t',

    // Recarregar Nginx
    'systemctl reload nginx',

    'echo "✅ Nginx atualizado! Limite de upload: 100MB"'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS! Atualizando Nginx...\n');

    const commandString = commands.join(' && ');

    conn.exec(commandString, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log(`\n✅ Finalizado com código: ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('❌ Erro:', err.message);
}).connect(config);
