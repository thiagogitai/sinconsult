const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'database.sqlite');
console.log('DB Path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening DB:', err);
    else console.log('DB opened successfully');
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error listing tables:', err);
            return;
        }
        console.log('Tables found:', tables.length);
        tables.forEach(table => {
            console.log(`\nTable: ${table.name}`);
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (err) console.error(`Error getting info for ${table.name}:`, err);
                else {
                    columns.forEach(col => {
                        console.log(`  - ${col.name} (${col.type})`);
                    });
                }
            });
        });
    });
});

// Wait a bit for async operations
setTimeout(() => {
    db.close();
}, 2000);
