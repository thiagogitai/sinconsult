const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('--- Contatos ---');
    db.all("SELECT id, name, phone, email FROM contacts LIMIT 20", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\n--- Logs de Erro Recentes (Mensagens) ---');
    db.all("SELECT id, contact_id, status, error_message, created_at FROM messages WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\n--- Mensagens da Campanha 10 ---');
    db.all("SELECT id, contact_id, status, error_message, created_at FROM messages WHERE campaign_id = 10", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
