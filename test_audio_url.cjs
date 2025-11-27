const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const commands = [
    // Tentar baixar o arquivo com curl para ver se a URL é válida
    'curl -I "https://certcrm.com.br/api/uploads/1764213811121-Nosso encontro jÃ¡ vai comeÃ§ar,.mp3"'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Testando URL do arquivo...\n');

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
