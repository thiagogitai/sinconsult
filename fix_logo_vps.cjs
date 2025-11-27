const { Client } = require('ssh2');
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
    console.log('📤 Enviando logo.svg...\n');

    conn.sftp((err, sftp) => {
        if (err) {
            console.log('❌ Erro SFTP:', err);
            conn.end();
            return;
        }

        const localPath = path.join(__dirname, 'public', 'logo.svg');
        const remotePath = '/root/simconsult/public/logo.svg';

        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) {
                console.log('❌ Erro ao enviar:', err);
                conn.end();
                return;
            }

            console.log('✅ logo.svg enviado!');

            // Também enviar logo-sim-consult.svg
            const localPath2 = path.join(__dirname, 'public', 'logo-sim-consult.svg');
            const remotePath2 = '/root/simconsult/public/logo-sim-consult.svg';

            sftp.fastPut(localPath2, remotePath2, (err) => {
                if (err) {
                    console.log('❌ Erro ao enviar logo-sim-consult.svg:', err);
                } else {
                    console.log('✅ logo-sim-consult.svg enviado!');
                }

                // Criar symlink de logo.png para logo.svg
                console.log('\n🔗 Criando link logo.png -> logo.svg...');
                conn.exec('cd /root/simconsult/public && rm -f logo.png && ln -s logo.svg logo.png', (err, stream) => {
                    stream.on('close', () => {
                        console.log('✅ Link criado!');
                        conn.end();
                    }).on('data', (data) => {
                        console.log(data.toString());
                    });
                });
            });
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
