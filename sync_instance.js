const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function syncInstance() {
    try {
        const result = await pool.query(`
      INSERT INTO whatsapp_instances (instance_id, name, phone_connected, status, is_active, last_connection)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (instance_id) DO UPDATE 
      SET status = $4, is_active = $5, last_connection = NOW()
      RETURNING *
    `, ['e0499606-07e9-4be0-86b0-a9aae0bb292f', 'simconsult', '5565981173624', 'open', true]);

        console.log('✅ Instância sincronizada:', result.rows[0]);
    } catch (err) {
        console.error('Erro ao sincronizar instância:', err);
    } finally {
        await pool.end();
    }
}

syncInstance();
