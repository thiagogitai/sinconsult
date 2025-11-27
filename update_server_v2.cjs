const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const localFile = 'c:/xampp/htdocs/sim/Sim/api/server.ts';
const remoteFile = '/root/simconsult/api/server.ts';

const conn = new Client();

console.log('Iniciando conexão SSH...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    conn.sftp((err, sftp) => {
        if (err) {
            console.error('Erro SFTP:', err);
            conn.end();
            return;
        }

        console.log(`Enviando ${localFile} para ${remoteFile}...`);

        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) {
                console.error('Erro ao enviar arquivo:', err);
                conn.end();
                return;
            }

            console.log('✅ Arquivo enviado com sucesso!');

            // Executar comandos para recompilar e reiniciar
            const commands = [
                'cd /root/simconsult',
                'rm -f api/server_restore.ts',
                'npm run build:server',
                'pm2 restart simconsult'
            ].join(' && ');

            console.log('Executando comandos remotos...');

            conn.exec(commands, (err, stream) => {
                if (err) {
                    console.error('Erro ao executar comandos:', err);
                    conn.end();
                    return;
                }

                stream.on('close', (code, signal) => {
                    console.log(`\nProcesso remoto finalizado com código: ${code}`);
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
