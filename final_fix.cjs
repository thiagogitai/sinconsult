const { Client } = require('ssh2');
const path = require('path');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

console.log('🔧 CORREÇÃO FINAL - Logo e Campanhas\n');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado!\n');

    // 1. Copiar logo válido
    conn.sftp((err, sftp) => {
        if (err) {
            console.log('❌ Erro SFTP:', err);
            conn.end();
            return;
        }

        const localPath = path.join(__dirname, 'uploads', '1764201737378-logoavia.png');
        const remotePath = '/root/simconsult/public/logo.png';

        console.log('📤 Copiando logo...');
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) {
                console.log('❌ Erro:', err);
                conn.end();
                return;
            }

            console.log('✅ Logo copiado!\n');
            console.log('🔄 Reiniciando PM2 e Nginx...\n');

            conn.exec('cd /root/simconsult && pm2 restart simconsult && nginx -s reload', (err, stream) => {
                stream.on('close', () => {
                    console.log('\n✅ CONCLUÍDO!');
                    console.log('\n📋 Teste agora:');
                    console.log('1. Limpe o cache do navegador (Ctrl+Shift+Del)');
                    console.log('2. Acesse https://certcrm.com.br/');
                    console.log('3. A logo deve aparecer');
                    console.log('4. Teste criar uma campanha\n');
                    conn.end();
                }).on('data', (data) => {
                    console.log(data.toString());
                });
            });
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro:', err);
}).connect(config);
