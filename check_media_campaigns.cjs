const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Mensagens das Campanhas 34, 35, 36 ===\n');
    db.all(`
    SELECT 
      m.id,
      m.campaign_id,
      c.name as campaign_name,
      c.message_type,
      m.status,
      m.error_message,
      cont.name as contact_name,
      cont.phone
    FROM messages m
    JOIN campaigns c ON c.id = m.campaign_id
    JOIN contacts cont ON cont.id = m.contact_id
    WHERE m.campaign_id IN (34, 35, 36)
    ORDER BY m.campaign_id
  `, (err, rows) => {
        if (err) { console.error(err); return; }
        console.table(rows);
        db.close();
    });
});
