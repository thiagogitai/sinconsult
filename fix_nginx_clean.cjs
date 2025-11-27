const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    // Restaurar backup
    'cp /etc/nginx/sites-available/certcrm.backup /etc/nginx/sites-available/certcrm',

    // Adicionar client_max_body_size corretamente
    `sed -i '/ssl_prefer_server_ciphers on;/a\\    client_max_body_size 100M;' /etc/nginx/sites-available/certcrm`,

    // Testar
    'nginx -t',

    // Recarregar
    'systemctl reload nginx',

    'echo "✅ Nginx configurado com limite de 100MB"'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Corrigindo Nginx...\n');

    const commandString = commands.join(' && ');

    conn.exec(commandString, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code) => {
            console.log(`\nCódigo: ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect(config);
