const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco no VPS
const DB_PATH = '/root/simconsult/api/database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao abrir banco:', err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

async function run() {
    try {
        // 1. Criar/Verificar contato 'teste1'
        const contact = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM contacts WHERE segment = 'teste1' LIMIT 1", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!contact) {
            console.log('Criando contato teste1...');
            await new Promise((resolve, reject) => {
                db.run(`
          INSERT INTO contacts (name, phone, segment, is_active, created_at, updated_at)
          VALUES ('Teste 1', '5511999999999', 'teste1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        } else {
            console.log('Contato teste1 já existe:', contact.name);
        }

        // 2. Criar Campanhas
        const campaigns = [
            {
                name: 'Teste Texto ' + Date.now(),
                message: 'Olá, este é um teste de envio de TEXTO para o segmento teste1.',
                type: 'text',
                mediaUrl: null
            },
            {
                name: 'Teste Imagem ' + Date.now(),
                message: 'Olá, este é um teste de envio de IMAGEM.',
                type: 'image',
                mediaUrl: 'https://www.w3schools.com/w3css/img_lights.jpg'
            },
            {
                name: 'Teste Audio ' + Date.now(),
                message: '', // Audio geralmente não tem caption na Evolution antigo, mas vamos deixar vazio
                type: 'audio',
                mediaUrl: 'https://github.com/rafael-neri/whatsapp-api/raw/main/public/audio_test.mp3' // URL pública confiável ou similar
            },
            {
                name: 'Teste Video ' + Date.now(),
                message: 'Teste de Video',
                type: 'video',
                mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
        ];

        for (const camp of campaigns) {
            console.log(`Criando campanha: ${camp.name} (${camp.type})`);

            await new Promise((resolve, reject) => {
                db.run(`
          INSERT INTO campaigns (
            name, message, media_url, type, target_segment, 
            status, scheduled_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [camp.name, camp.message, camp.mediaUrl, camp.type, 'teste1'], function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        }

        console.log('Todas as campanhas de teste foram criadas!');

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        db.close();
    }
}

run();
