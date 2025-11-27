const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    // Ver configuração atual
    'grep -n "client_max_body_size" /etc/nginx/sites-available/certcrm',

    // Remover todas as linhas duplicadas
    `sed -i '/client_max_body_size/d' /etc/nginx/sites-available/certcrm`,

    // Adicionar apenas uma vez
    `sed -i '/ssl_prefer_server_ciphers on;/a\\    client_max_body_size 100M;' /etc/nginx/sites-available/certcrm`,

    // Testar
    'nginx -t',

    // Recarregar
    'systemctl reload nginx',

    'echo "✅ Nginx OK - Limite: 100MB"'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Limpando e configurando Nginx...\n');

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
