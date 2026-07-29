import * as SQLite from 'expo-sqlite';
import type { PhotoMeta } from '../types';

const db = SQLite.openDatabaseSync('selecta.db');

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      asset_id TEXT PRIMARY KEY NOT NULL,
      rating INTEGER NOT NULL DEFAULT 0,
      custom_name TEXT,
      pending_delete INTEGER NOT NULL DEFAULT 0
    );
  `);

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(photos)');
  if (!columns.some((c) => c.name === 'pending_delete')) {
    await db.execAsync('ALTER TABLE photos ADD COLUMN pending_delete INTEGER NOT NULL DEFAULT 0');
  }
}

export async function getAllMeta(): Promise<Map<string, PhotoMeta>> {
  const rows = await db.getAllAsync<{
    asset_id: string;
    rating: number;
    custom_name: string | null;
    pending_delete: number;
  }>('SELECT asset_id, rating, custom_name, pending_delete FROM photos');
  const map = new Map<string, PhotoMeta>();
  for (const row of rows) {
    map.set(row.asset_id, {
      rating: row.rating,
      customName: row.custom_name,
      pendingDelete: row.pending_delete === 1,
    });
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

export async function setPendingDelete(assetId: string, pendingDelete: boolean) {
  await db.runAsync(
    `INSERT INTO photos (asset_id, rating, pending_delete) VALUES (?, 0, ?)
     ON CONFLICT(asset_id) DO UPDATE SET pending_delete = excluded.pending_delete`,
    [assetId, pendingDelete ? 1 : 0]
  );
}

export async function getPendingDeleteAssetIds(): Promise<string[]> {
  const rows = await db.getAllAsync<{ asset_id: string }>(
    'SELECT asset_id FROM photos WHERE pending_delete = 1'
  );
  return rows.map((r) => r.asset_id);
}

export async function deleteMetaRows(assetIds: string[]) {
  if (assetIds.length === 0) return;
  const placeholders = assetIds.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM photos WHERE asset_id IN (${placeholders})`, assetIds);
}
