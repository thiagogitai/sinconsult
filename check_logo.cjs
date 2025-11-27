const { Client } = require('ssh2');

const config = {
    host: '167.88.33.24',
    port: 22,
    username: 'root',
    password: 'zMxn1029@@@@'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Conectado ao VPS!\n');

    // Verificar tamanho do logo.png
    conn.exec('ls -lh /root/simconsult/public/logo.png && file /root/simconsult/public/logo.png', (err, stream) => {
        if (err) {
            console.log('❌ Erro:', err);
            conn.end();
            return;
        }

        stream.on('close', () => {
            console.log('\n📁 Verificando se é um arquivo válido...\n');

            // Verificar se o arquivo local é válido
            const fs = require('fs');
            const path = require('path');
            const localPath = path.join(__dirname, 'public', 'logo.png');

            if (fs.existsSync(localPath)) {
                const stats = fs.statSync(localPath);
                console.log(`📊 Arquivo local: ${localPath}`);
                console.log(`   Tamanho: ${stats.size} bytes`);

                if (stats.size < 100) {
                    console.log('⚠️  PROBLEMA: Arquivo muito pequeno! Pode estar corrompido.');
                } else {
                    console.log('✅ Arquivo local parece válido.');
                }
            } else {
                console.log('❌ Arquivo local não encontrado!');
            }

            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.log('STDERR:', data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
