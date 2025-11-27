const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const localLogo = 'c:/xampp/htdocs/sim/Sim/public/logo.png';
const remoteLogo = '/root/simconsult/public/logo.png';

const conn = new Client();

console.log('Iniciando conexão SSH para upload da logo...');

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    conn.sftp((err, sftp) => {
        if (err) {
            console.error('Erro SFTP:', err);
            conn.end();
            return;
        }

        console.log(`Enviando ${localLogo} para ${remoteLogo}...`);

        sftp.fastPut(localLogo, remoteLogo, (err) => {
            if (err) {
                console.error('Erro ao enviar logo:', err);
                conn.end();
                return;
            }

            console.log('✅ Logo enviada com sucesso!');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
}).connect(config);
