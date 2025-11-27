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
        // Criar campanhas com URLs de mídia mais confiáveis e pequenas
        const campaigns = [
            {
                name: 'Teste AUDIO v2 ' + Date.now(),
                message: '',
                type: 'audio',
                // Áudio MP3 pequeno e confiável
                mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
            },
            {
                name: 'Teste VIDEO v2 ' + Date.now(),
                message: 'Teste de vídeo pequeno',
                type: 'video',
                // Vídeo MP4 pequeno
                mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
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

        console.log('\n✅ Campanhas de teste v2 criadas!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        db.close();
    }
}

run();
