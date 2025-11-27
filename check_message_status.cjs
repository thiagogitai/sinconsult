const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Mensagens por Campanha e Status ===\n');
    db.all(`
    SELECT 
      campaign_id,
      status,
      COUNT(*) as count
    FROM messages
    GROUP BY campaign_id, status
    ORDER BY campaign_id DESC, status
  `, (err, rows) => {
        if (err) { console.error(err); return; }
        console.table(rows);

        console.log('\n=== Campanhas com mensagens SENT ===\n');
        db.all(`
      SELECT DISTINCT campaign_id
      FROM messages
      WHERE status = 'sent'
      ORDER BY campaign_id DESC
      LIMIT 5
    `, (err2, campaigns) => {
            if (err2) { console.error(err2); return; }
            if (campaigns.length > 0) {
                console.log('IDs de campanhas com mensagens SENT:', campaigns.map(c => c.campaign_id).join(', '));
            } else {
                console.log('⚠️  Nenhuma campanha com mensagens SENT encontrada');
            }
            db.close();
        });
    });
});
