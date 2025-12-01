import sqlite3 from 'sqlite3';

const DB_PATH = '/root/simconsult/database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao abrir banco:', err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

async function run() {
    try {
        console.log('Iniciando migração da tabela messages...');

        // 1. Desabilitar chaves estrangeiras temporariamente
        await runQuery('PRAGMA foreign_keys = OFF');

        // 2. Iniciar transação
        await runQuery('BEGIN TRANSACTION');

        // 3. Criar nova tabela messages com ON DELETE CASCADE e contact_id NULLABLE (opcional, mas CASCADE é melhor)
        // Vamos manter NOT NULL mas usar CASCADE
        await runQuery(`
            CREATE TABLE messages_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              contact_id INTEGER NOT NULL,
              campaign_id INTEGER,
              content TEXT NOT NULL,
              message_type TEXT DEFAULT 'text',
              media_url TEXT,
              status TEXT DEFAULT 'pending',
              sent_at DATETIME,
              delivered_at DATETIME,
              read_at DATETIME,
              error_message TEXT,
              evolution_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
              FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
            )
        `);

        // 4. Copiar dados
        await runQuery(`
            INSERT INTO messages_new (id, contact_id, campaign_id, content, message_type, media_url, status, sent_at, delivered_at, read_at, error_message, evolution_id, created_at)
            SELECT id, contact_id, campaign_id, content, message_type, media_url, status, sent_at, delivered_at, read_at, error_message, evolution_id, created_at
            FROM messages
        `);

        // 5. Dropar tabela antiga
        await runQuery('DROP TABLE messages');

        // 6. Renomear nova tabela
        await runQuery('ALTER TABLE messages_new RENAME TO messages');

        // 7. Recriar índices
        await runQuery('CREATE INDEX idx_messages_contact ON messages(contact_id)');
        await runQuery('CREATE INDEX idx_messages_campaign ON messages(campaign_id)');
        await runQuery('CREATE INDEX idx_messages_status ON messages(status)');

        // 8. Commitar
        await runQuery('COMMIT');

        // 9. Reabilitar chaves estrangeiras
        await runQuery('PRAGMA foreign_keys = ON');

        console.log('✅ Migração concluída com sucesso! Tabela messages corrigida.');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        await runQuery('ROLLBACK');
    } finally {
        db.close();
    }
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

run();
