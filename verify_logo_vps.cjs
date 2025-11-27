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

    console.log('1️⃣ Verificando arquivo logo.png...\n');
    conn.exec('ls -lh /root/simconsult/public/logo.png && file /root/simconsult/public/logo.png', (err, stream) => {
        stream.on('close', () => {
            console.log('\n2️⃣ Verificando se servidor está servindo public...\n');

            conn.exec('cd /root/simconsult && grep -n "public" dist-server/api/server.js | head -20', (err, stream2) => {
                stream2.on('close', () => {
                    console.log('\n3️⃣ Testando acesso ao logo via curl...\n');

                    conn.exec('curl -I http://localhost:3006/logo.png', (err, stream3) => {
                        stream3.on('close', () => {
                            conn.end();
                        }).on('data', (data) => {
                            console.log(data.toString());
                        });
                    });
                }).on('data', (data) => {
                    console.log(data.toString());
                });
            });
        }).on('data', (data) => {
            console.log(data.toString());
        });
    });

}).on('error', (err) => {
    console.log('❌ Erro de conexão:', err);
}).connect(config);
