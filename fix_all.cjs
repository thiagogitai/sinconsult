const { Client } = require('ssh2');
const path = require('path');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

console.log('🔧 CORREÇÃO COMPLETA DO SISTEMA\n');
console.log('1. Copiando logo válido');
console.log('2. Verificando código de envio');
console.log('3. Reiniciando servidor\n');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!\n');

    // 1. Copiar logo válido
    conn.sftp((err, sftp) => {
        if (err) {
            console.log('❌ Erro SFTP:', err);
            conn.end();
            return;
        }

        const localPath = path.join(__dirname, 'uploads', '1764201737378-logoavia.png');
        const remotePath = '/root/simconsult/public/logo.png';

        console.log('📤 Enviando logo válido...');
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) {
                console.log('❌ Erro ao enviar logo:', err);
                conn.end();
                return;
            }

            console.log('✅ Logo enviado!\n');

            // 2. Reiniciar PM2
            console.log('🔄 Reiniciando servidor...');
            conn.exec('cd /root/simconsult && pm2 restart simconsult', (err, stream) => {
                stream.on('close', () => {
                    console.log('\n✅ Servidor reiniciado!');
                    console.log('\n📋 Verificando logs...');

                    // 3. Mostrar logs
                    conn.exec('pm2 logs simconsult --lines 10 --nostream', (err, stream2) => {
                        stream2.on('close', () => {
                            conn.end();
                        }).on('data', (data) => {
                            console.log(data.toString());
                        });
                    });
                }).on('data', (data) => {
                    console.log(data.toString());
                });
            });
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
