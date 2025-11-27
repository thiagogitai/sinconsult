const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!');

    // Verificar se pasta public existe
    conn.exec('ls -la /root/simconsult/public/', (err, stream) => {
        if (err) {
            console.log('❌ Erro:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            if (code !== 0) {
                console.log('📁 Pasta public não existe, criando...');
                conn.exec('mkdir -p /root/simconsult/public', (err2) => {
                    if (err2) {
                        console.log('❌ Erro ao criar pasta:', err2);
                        conn.end();
                        return;
                    }
                    console.log('✅ Pasta criada!');
                    uploadLogo();
                });
            } else {
                console.log('✅ Pasta public já existe!');
                uploadLogo();
            }
        }).on('data', (data) => {
            console.log('Conteúdo:', data.toString());
        });
    });

    function uploadLogo() {
        console.log('📤 Enviando logo.png...');

        conn.sftp((err, sftp) => {
            if (err) {
                console.log('❌ Erro SFTP:', err);
                conn.end();
                return;
            }

            const localPath = path.join(__dirname, 'public', 'logo.png');
            const remotePath = '/root/simconsult/public/logo.png';

            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) {
                    console.log('❌ Erro ao enviar:', err);
                } else {
                    console.log('✅ Logo enviado com sucesso!');
                }
                conn.end();
            });
        });
    }

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
