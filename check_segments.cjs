const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Contatos e Segmentos ===');
    db.all("SELECT id, name, phone, segment FROM contacts", (err, rows) => {
        if (err) { console.error(err); return; }
        console.table(rows);
    });
});

db.close();
