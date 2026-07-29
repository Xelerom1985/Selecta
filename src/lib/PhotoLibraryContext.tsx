import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as MediaLibrary from 'expo-media-library/legacy';
import { ensurePermission, getAllPhotoAssets } from './mediaLibrary';
import {
  deleteMetaRows,
  getAllMeta,
  getPendingDeleteAssetIds,
  initDatabase,
  setCustomName,
  setPendingDelete,
  setRating,
} from '../db/database';
import type { PhotoMeta } from '../types';

const EMPTY_META: PhotoMeta = { rating: 0, customName: null, pendingDelete: false };

type PhotoLibraryContextValue = {
  assets: MediaLibrary.Asset[];
  assetsById: Map<string, MediaLibrary.Asset>;
  loading: boolean;
  permissionGranted: boolean;
  refresh: () => Promise<void>;
  getMeta: (assetId: string) => PhotoMeta;
  rate: (assetId: string, rating: number) => Promise<void>;
  rename: (assetId: string, name: string) => Promise<void>;
  markForDelete: (assetId: string, pendingDelete: boolean) => Promise<void>;
  pendingDeleteCount: number;
  confirmDeletions: () => Promise<number>;
};

const PhotoLibraryContext = createContext<PhotoLibraryContextValue | null>(null);

export function PhotoLibraryProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [metaMap, setMetaMap] = useState<Map<string, PhotoMeta>>(new Map());
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const granted = await ensurePermission();
    setPermissionGranted(granted);
    if (granted) {
      const [fetchedAssets, fetchedMeta] = await Promise.all([getAllPhotoAssets(), getAllMeta()]);
      setAssets(fetchedAssets.reverse());
      setMetaMap(fetchedMeta);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await refresh();
    })();
  }, [refresh]);

  const getMeta = useCallback(
    (assetId: string): PhotoMeta => metaMap.get(assetId) ?? EMPTY_META,
    [metaMap]
  );

  const rate = useCallback(async (assetId: string, rating: number) => {
    await setRating(assetId, rating);
    setMetaMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) ?? EMPTY_META;
      next.set(assetId, { ...existing, rating });
      return next;
    });
  }, []);

  const rename = useCallback(async (assetId: string, name: string) => {
    await setCustomName(assetId, name);
    setMetaMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) ?? EMPTY_META;
      next.set(assetId, { ...existing, customName: name });
      return next;
    });
  }, []);

  const markForDelete = useCallback(async (assetId: string, pendingDelete: boolean) => {
    await setPendingDelete(assetId, pendingDelete);
    setMetaMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) ?? EMPTY_META;
      next.set(assetId, { ...existing, pendingDelete });
      return next;
    });
  }, []);

  const pendingDeleteCount = useMemo(
    () => Array.from(metaMap.values()).filter((m) => m.pendingDelete).length,
    [metaMap]
  );

  const confirmDeletions = useCallback(async () => {
    const idsFromDb = await getPendingDeleteAssetIds();
    if (idsFromDb.length === 0) return 0;
    await MediaLibrary.deleteAssetsAsync(idsFromDb);
    await deleteMetaRows(idsFromDb);
    setMetaMap((prev) => {
      const next = new Map(prev);
      for (const id of idsFromDb) next.delete(id);
      return next;
    });
    setAssets((prev) => prev.filter((a) => !idsFromDb.includes(a.id)));
    return idsFromDb.length;
  }, []);

  const assetsById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const value = useMemo(
    () => ({
      assets,
      assetsById,
      loading,
      permissionGranted,
      refresh,
      getMeta,
      rate,
      rename,
      markForDelete,
      pendingDeleteCount,
      confirmDeletions,
    }),
    [
      assets,
      assetsById,
      loading,
      permissionGranted,
      refresh,
      getMeta,
      rate,
      rename,
      markForDelete,
      pendingDeleteCount,
      confirmDeletions,
    ]
  );

  return <PhotoLibraryContext.Provider value={value}>{children}</PhotoLibraryContext.Provider>;
}

export function usePhotoLibrary() {
  const ctx = useContext(PhotoLibraryContext);
  if (!ctx) throw new Error('usePhotoLibrary must be used within PhotoLibraryProvider');
  return ctx;
}
