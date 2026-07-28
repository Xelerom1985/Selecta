import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as MediaLibrary from 'expo-media-library/legacy';
import { ensurePermission, getAllPhotoAssets } from './mediaLibrary';
import { getAllMeta, initDatabase, setCustomName, setRating } from '../db/database';
import type { PhotoMeta } from '../types';

type PhotoLibraryContextValue = {
  assets: MediaLibrary.Asset[];
  assetsById: Map<string, MediaLibrary.Asset>;
  loading: boolean;
  permissionGranted: boolean;
  refresh: () => Promise<void>;
  getMeta: (assetId: string) => PhotoMeta;
  rate: (assetId: string, rating: number) => Promise<void>;
  rename: (assetId: string, name: string) => Promise<void>;
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
    (assetId: string): PhotoMeta => metaMap.get(assetId) ?? { rating: 0, customName: null },
    [metaMap]
  );

  const rate = useCallback(async (assetId: string, rating: number) => {
    await setRating(assetId, rating);
    setMetaMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) ?? { rating: 0, customName: null };
      next.set(assetId, { ...existing, rating });
      return next;
    });
  }, []);

  const rename = useCallback(async (assetId: string, name: string) => {
    await setCustomName(assetId, name);
    setMetaMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) ?? { rating: 0, customName: null };
      next.set(assetId, { ...existing, customName: name });
      return next;
    });
  }, []);

  const assetsById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const value = useMemo(
    () => ({ assets, assetsById, loading, permissionGranted, refresh, getMeta, rate, rename }),
    [assets, assetsById, loading, permissionGranted, refresh, getMeta, rate, rename]
  );

  return <PhotoLibraryContext.Provider value={value}>{children}</PhotoLibraryContext.Provider>;
}

export function usePhotoLibrary() {
  const ctx = useContext(PhotoLibraryContext);
  if (!ctx) throw new Error('usePhotoLibrary must be used within PhotoLibraryProvider');
  return ctx;
}
