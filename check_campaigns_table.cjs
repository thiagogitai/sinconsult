const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("PRAGMA table_info(campaigns)", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Estrutura da tabela campaigns:');
    console.log(rows);
    db.close();
});
