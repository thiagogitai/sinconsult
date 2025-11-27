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
        // 1. Atualizar o contato teste1 com o número real
        console.log('Atualizando contato teste1 com número real...');
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE contacts 
                SET phone = '5565981173624', name = 'THIAGO LUIZ BARBOSA'
                WHERE segment = 'teste1'
            `, function (err) {
                if (err) reject(err);
                else {
                    console.log(`Contato atualizado. Linhas afetadas: ${this.changes}`);
                    resolve(this.changes);
                }
            });
        });

        // 2. Criar novas campanhas de teste
        const campaigns = [
            {
                name: 'Teste TEXTO Final ' + Date.now(),
                message: 'Olá THIAGO! Este é um teste de mensagem de TEXTO. Se você recebeu isso, o envio de texto está funcionando! 🎉',
                type: 'text',
                mediaUrl: null
            },
            {
                name: 'Teste IMAGEM Final ' + Date.now(),
                message: 'Teste de IMAGEM com legenda',
                type: 'image',
                mediaUrl: 'https://picsum.photos/800/600'
            },
            {
                name: 'Teste AUDIO Final ' + Date.now(),
                message: '',
                type: 'audio',
                mediaUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
            },
            {
                name: 'Teste VIDEO Final ' + Date.now(),
                message: 'Teste de VIDEO',
                type: 'video',
                mediaUrl: 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4'
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

        console.log('\n✅ Todas as campanhas foram criadas e agendadas!');
        console.log('As campanhas serão processadas automaticamente pelo agendador.');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        db.close();
    }
}

run();
