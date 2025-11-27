import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

(async () => {
    const dbPath = path.join(process.cwd(), 'api/database.sqlite');
    console.log(`Opening DB at ${dbPath}`);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    for (const table of tables) {
        console.log(`Table: ${table.name}`);
        const columns = await db.all(`PRAGMA table_info(${table.name})`);
        console.log(columns.map(c => `${c.name} (${c.type})`).join(', '));
        console.log('---');
    }
})();
