import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/**
 * Inicializa a conexao com SQLite (arquivo local)
 */
export async function initDatabase(): Promise<void> {
  if (db) return;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Garantir integracao de chaves estrangeiras e performance melhor
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA journal_mode = WAL;');

  logger.info(`SQLite conectado em ${dbPath}`);
}

/**
 * Executa uma query que retorna multiplas linhas
 */
export async function dbAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!db) throw new Error('Database n�o foi inicializado. Chame initDatabase() primeiro.');

  try {
    return await db.all<T[]>(query, params);
  } catch (error) {
    logger.error('Erro em dbAll:', { query, params, error });
    throw error;
  }
}

/**
 * Executa uma query que retorna uma unica linha
 */
export async function dbGet<T = any>(query: string, params: any[] = []): Promise<T | null> {
  if (!db) throw new Error('Database n�o foi inicializado. Chame initDatabase() primeiro.');

  try {
    const result = await db.get<T>(query, params);
    return result ?? null;
  } catch (error) {
    logger.error('Erro em dbGet:', { query, params, error });
    throw error;
  }
}

/**
 * Executa uma query de modifica��o (INSERT, UPDATE, DELETE)
 */
export async function dbRun(
  query: string,
  params: any[] = []
): Promise<{ lastID?: number; changes: number }> {
  if (!db) throw new Error('Database n�o foi inicializado. Chame initDatabase() primeiro.');

  try {
    const result = await db.run(query, params);
    return {
      lastID: result?.lastID,
      changes: result?.changes ?? 0,
    };
  } catch (error) {
    logger.error('Erro em dbRun:', { query, params, error });
    throw error;
  }
}

/**
 * Fecha a conexao SQLite
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info('Conexao com SQLite fechada');
  }
}
