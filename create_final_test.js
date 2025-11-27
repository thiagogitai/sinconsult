import sqlite3 from 'sqlite3';

const DB_PATH = '/root/simconsult/database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao abrir banco:', err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

async function run() {
    try {
        // Criar campanhas de teste FINAL
        const campaigns = [
            {
                name: 'TESTE FINAL - TEXTO ' + Date.now(),
                message: 'Olá! Esta é uma mensagem de TEXTO puro. Se você recebeu isso, o envio de texto está 100% funcional! ✅',
                type: 'text',
                mediaUrl: null
            },
            {
                name: 'TESTE FINAL - IMAGEM COM TEXTO ' + Date.now(),
                message: 'Esta é a LEGENDA da imagem. Você deve receber a imagem COM este texto embaixo! 📸',
                type: 'image',
                mediaUrl: 'https://picsum.photos/800/600'
            },
            {
                name: 'TESTE FINAL - VIDEO COM TEXTO ' + Date.now(),
                message: 'Esta é a LEGENDA do vídeo. Você deve receber o vídeo COM este texto! 🎥',
                type: 'video',
                mediaUrl: 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4'
            },
            {
                name: 'TESTE FINAL - AUDIO ' + Date.now(),
                message: '',
                type: 'audio',
                mediaUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
            }
        ];

        for (const camp of campaigns) {
            console.log(`Criando campanha: ${camp.name} (${camp.type})`);

            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO campaigns (
                        name, message, media_url, message_type, target_segment, 
                        status, scheduled_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, 'scheduled', datetime('now'), datetime('now'), datetime('now'))
                `, [camp.name, camp.message, camp.mediaUrl, camp.type, 'teste1'], function (err) {
                    if (err) reject(err);
                    else {
                        console.log(`  ✅ Campanha criada com ID: ${this.lastID}`);
                        resolve(this.lastID);
                    }
                });
            });
        }

        console.log('\n✅ Todas as campanhas de teste FINAL foram criadas!');
        console.log('Aguarde alguns segundos para o processamento automático...');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        db.close();
    }
}

run();
