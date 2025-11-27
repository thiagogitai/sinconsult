const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('=== Configurações de API ===');
    db.all("SELECT * FROM app_settings WHERE category = 'api'", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
