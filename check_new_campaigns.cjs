const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Status das Campanhas 37, 38, 39 ===\n');

    setTimeout(() => {
        db.all(`
      SELECT 
        m.id,
        m.campaign_id,
        c.name as campaign_name,
        c.message_type,
        m.status,
        m.error_message,
        cont.name as contact_name
      FROM messages m
      JOIN campaigns c ON c.id = m.campaign_id
      JOIN contacts cont ON cont.id = m.contact_id
      WHERE m.campaign_id IN (37, 38, 39)
      ORDER BY m.campaign_id
    `, (err, rows) => {
            if (err) { console.error(err); return; }

            if (rows.length === 0) {
                console.log('⏳ Aguardando... As mensagens ainda estão sendo processadas.');
                console.log('Execute este script novamente em alguns segundos.');
            } else {
                console.table(rows);

                const sent = rows.filter(r => r.status === 'sent').length;
                const failed = rows.filter(r => r.status === 'failed').length;

                console.log(`\n📊 Resumo:`);
                console.log(`   ✅ Enviadas: ${sent}`);
                console.log(`   ❌ Falhadas: ${failed}`);
            }
            db.close();
        });
    }, 3000); // Aguardar 3s para as mensagens serem processadas
});
