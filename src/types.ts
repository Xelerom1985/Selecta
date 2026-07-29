export type RootStackParamList = {
  Home: undefined;
  Folder: { assetIds: string[]; title: string };
  PhotoDetail: { assetIds: string[]; index: number };
};

export type PhotoMeta = {
  rating: number;
  customName: string | null;
  pendingDelete: boolean;
};
