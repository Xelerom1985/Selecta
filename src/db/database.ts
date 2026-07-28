import * as SQLite from 'expo-sqlite';
import type { PhotoMeta } from '../types';

const db = SQLite.openDatabaseSync('selecta.db');

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      asset_id TEXT PRIMARY KEY NOT NULL,
      rating INTEGER NOT NULL DEFAULT 0,
      custom_name TEXT
    );
  `);
}

export async function getAllMeta(): Promise<Map<string, PhotoMeta>> {
  const rows = await db.getAllAsync<{ asset_id: string; rating: number; custom_name: string | null }>(
    'SELECT asset_id, rating, custom_name FROM photos'
  );
  const map = new Map<string, PhotoMeta>();
  for (const row of rows) {
    map.set(row.asset_id, { rating: row.rating, customName: row.custom_name });
  }
  return map;
}

export async function setRating(assetId: string, rating: number) {
  await db.runAsync(
    `INSERT INTO photos (asset_id, rating) VALUES (?, ?)
     ON CONFLICT(asset_id) DO UPDATE SET rating = excluded.rating`,
    [assetId, rating]
  );
}

export async function setCustomName(assetId: string, name: string) {
  await db.runAsync(
    `INSERT INTO photos (asset_id, rating, custom_name) VALUES (?, 0, ?)
     ON CONFLICT(asset_id) DO UPDATE SET custom_name = excluded.custom_name`,
    [assetId, name]
  );
}

export async function getMeta(assetId: string): Promise<PhotoMeta> {
  const row = await db.getFirstAsync<{ rating: number; custom_name: string | null }>(
    'SELECT rating, custom_name FROM photos WHERE asset_id = ?',
    [assetId]
  );
  return row ? { rating: row.rating, customName: row.custom_name } : { rating: 0, customName: null };
}
