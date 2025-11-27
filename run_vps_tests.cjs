const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const localScript = 'c:/xampp/htdocs/sim/Sim/create_vps_tests.js';
const remoteScript = '/root/simconsult/create_vps_tests.js';

const conn = new Client();

console.log('Enviando e executando script de teste...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    conn.sftp((err, sftp) => {
        if (err) {
            console.error('Erro SFTP:', err);
            conn.end();
            return;
        }

        sftp.fastPut(localScript, remoteScript, (err) => {
            if (err) {
                console.error('Erro ao enviar script:', err);
                conn.end();
                return;
            }

            console.log('✅ Script enviado. Executando...');

            conn.exec(`cd /root/simconsult && node create_vps_tests.js`, (err, stream) => {
                if (err) throw err;

                stream.on('close', (code, signal) => {
                    console.log(`\nExecução finalizada com código: ${code}`);
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
}).connect(config);
