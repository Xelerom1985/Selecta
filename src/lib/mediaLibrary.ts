import * as MediaLibrary from 'expo-media-library/legacy';

export async function ensurePermission(): Promise<boolean> {
  const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
  if (status === 'granted') return true;
  const res = await MediaLibrary.requestPermissionsAsync();
  return res.status === 'granted' || res.accessPrivileges === 'limited' || accessPrivileges === 'limited';
}

export async function getAllPhotoAssets(): Promise<MediaLibrary.Asset[]> {
  const assets: MediaLibrary.Asset[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 200,
      after,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });
    assets.push(...page.assets);
    hasNextPage = page.hasNextPage;
    after = page.endCursor;
  }

  return assets;
}
