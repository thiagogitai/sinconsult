const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Últimas 5 Campanhas ===');
    db.all("SELECT id, name, status, created_at FROM campaigns ORDER BY id DESC LIMIT 5", (err, campaigns) => {
        if (err) { console.error(err); db.close(); return; }
        console.table(campaigns);

        const lastId = 21;
        console.log(`\n=== Mensagens da Campanha (ID: ${lastId}) ===`);
        db.all(`SELECT id, contact_id, status, message_type, sent_at, error_message FROM messages WHERE campaign_id = ${lastId}`, (err, messages) => {
            if (err) { console.error(err); db.close(); return; }

            if (messages.length === 0) {
                console.log('⚠️ Nenhuma mensagem encontrada para esta campanha.');
            } else {
                console.log(`Total de mensagens: ${messages.length}`);
                console.table(messages);

                const sent = messages.filter(m => m.status === 'sent').length;
                const failed = messages.filter(m => m.status === 'failed').length;
                const pending = messages.filter(m => m.status === 'pending').length;

                console.log('\nResumo:');
                console.log(`✅ Enviadas: ${sent}`);
                console.log(`❌ Falhas: ${failed}`);
                console.log(`⏳ Pendentes: ${pending}`);
            }
            db.close();
        });
    });
});
