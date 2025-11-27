const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function resetPassword() {
    try {
        const email = 'admin@crm.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Tentando resetar senha para:', email);

        // Verificar se usuário existe
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length === 0) {
            console.log('Usuário não encontrado. Criando...');
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
                ['Admin', email, hashedPassword, 'admin', true]
            );
            console.log('Usuário criado com sucesso!');
        } else {
            const res = await pool.query(
                'UPDATE users SET password_hash = $1, is_active = true WHERE email = $2 RETURNING *',
                [hashedPassword, email]
            );
            console.log('✅ Senha atualizada com sucesso para', email);
        }
    } catch (err) {
        console.error('Erro ao resetar senha:', err);
    } finally {
        await pool.end();
    }
}

resetPassword();
