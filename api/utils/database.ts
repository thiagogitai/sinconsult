import pg from 'pg';
import { logger } from './logger.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Inicializa o pool de conexões PostgreSQL
 */
export async function initDatabase(): Promise<void> {
    try {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL não está definida no .env');
        }

        pool = new Pool({
            connectionString: databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Testar conexão
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        logger.info('✅ Conectado ao PostgreSQL com sucesso!');
    } catch (error) {
        logger.error('❌ Erro ao conectar ao PostgreSQL:', { error });
        throw error;
    }
}

/**
 * Converte placeholders SQLite (?) para PostgreSQL ($1, $2, ...)
 */
function convertPlaceholders(query: string, params: any[]): { text: string; values: any[] } {
    let paramIndex = 1;
    const text = query.replace(/\?/g, () => `$${paramIndex++}`);
    return { text, values: params };
}

/**
 * Executa uma query que retorna múltiplas linhas
 */
export async function dbAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
    if (!pool) {
        throw new Error('Database não foi inicializado. Chame initDatabase() primeiro.');
    }

    try {
        const { text, values } = convertPlaceholders(query, params);
        const result = await pool.query(text, values);
        return result.rows as T[];
    } catch (error) {
        logger.error('Erro em dbAll:', { query, params, error });
        throw error;
    }
}

/**
 * Executa uma query que retorna uma única linha
 */
export async function dbGet<T = any>(query: string, params: any[] = []): Promise<T | null> {
    if (!pool) {
        throw new Error('Database não foi inicializado. Chame initDatabase() primeiro.');
    }

    try {
        const { text, values } = convertPlaceholders(query, params);
        const result = await pool.query(text, values);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Erro em dbGet:', { query, params, error });
        throw error;
    }
}

/**
 * Executa uma query de modificação (INSERT, UPDATE, DELETE)
 */
export async function dbRun(
    query: string,
    params: any[] = []
): Promise<{ lastID?: number; changes: number }> {
    if (!pool) {
        throw new Error('Database não foi inicializado. Chame initDatabase() primeiro.');
    }

    try {
        const { text, values } = convertPlaceholders(query, params);

        // Se for INSERT, adicionar RETURNING id para obter lastID
        let finalQuery = text;
        if (text.trim().toUpperCase().startsWith('INSERT')) {
            // Verificar se já tem RETURNING
            if (!text.toUpperCase().includes('RETURNING')) {
                finalQuery = `${text} RETURNING id`;
            }
        }

        const result = await pool.query(finalQuery, values);

        return {
            lastID: result.rows[0]?.id,
            changes: result.rowCount || 0
        };
    } catch (error) {
        logger.error('Erro em dbRun:', { query, params, error });
        throw error;
    }
}

/**
 * Fecha o pool de conexões
 */
export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Pool de conexões PostgreSQL fechado');
    }
}
