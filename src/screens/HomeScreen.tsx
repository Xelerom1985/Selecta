import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { usePhotoLibrary } from '../lib/PhotoLibraryContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FOLDERS = [
  { rating: 0, label: 'Sin puntuar', icon: '—' },
  { rating: 1, label: '1 estrella', icon: '★' },
  { rating: 2, label: '2 estrellas', icon: '★★' },
  { rating: 3, label: '3 estrellas', icon: '★★★' },
  { rating: 4, label: '4 estrellas', icon: '★★★★' },
  { rating: 5, label: '5 estrellas', icon: '★★★★★' },
];

export default function HomeScreen({ navigation }: Props) {
  const { assets, getMeta, loading, permissionGranted, refresh } = usePhotoLibrary();
  const [query, setQuery] = useState('');

  const countsByRating = useMemo(() => {
    const counts = new Map<number, number>();
    for (const asset of assets) {
      const rating = getMeta(asset.id).rating;
      counts.set(rating, (counts.get(rating) ?? 0) + 1);
    }
    return counts;
  }, [assets, getMeta]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return assets.filter((asset) => (getMeta(asset.id).customName ?? '').toLowerCase().includes(q));
  }, [assets, getMeta, query]);

  if (!permissionGranted && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Selecta necesita permiso para acceder a tus fotos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={refresh}>
          <Text style={styles.permissionButtonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecta</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
      />

      {query.trim().length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchRow}
              onPress={() =>
                navigation.navigate('PhotoDetail', {
                  assetIds: searchResults.map((a) => a.id),
                  index: searchResults.findIndex((a) => a.id === item.id),
                })
              }
            >
              <Text style={styles.searchRowText} numberOfLines={1}>
                {getMeta(item.id).customName}
              </Text>
              <Text style={styles.searchRowStars}>
                {getMeta(item.id).rating > 0 ? '★'.repeat(getMeta(item.id).rating) : 'sin puntuar'}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay fotos con ese nombre.</Text>}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#F5C518" />
        </View>
      ) : (
        <FlatList
          data={FOLDERS}
          keyExtractor={(item) => String(item.rating)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#F5C518" />}
          renderItem={({ item }) => {
            const folderAssets = assets.filter((a) => getMeta(a.id).rating === item.rating);
            return (
              <TouchableOpacity
                style={styles.folder}
                onPress={() =>
                  navigation.navigate('Folder', {
                    assetIds: folderAssets.map((a) => a.id),
                    title: item.label,
                  })
                }
              >
                <Text style={styles.folderIcon}>{item.icon}</Text>
                <Text style={styles.folderLabel}>{item.label}</Text>
                <Text style={styles.folderCount}>{countsByRating.get(item.rating) ?? 0} fotos</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1729', paddingTop: 60, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: 'white', fontSize: 28, fontWeight: '700', marginBottom: 16 },
  search: {
    backgroundColor: '#1B2A47',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 15,
  },
  listContent: { paddingBottom: 40 },
  folder: {
    flex: 1,
    backgroundColor: '#1B2A47',
    borderRadius: 16,
    margin: 6,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  folderIcon: { color: '#F5C518', fontSize: 18 },
  folderLabel: { color: 'white', fontSize: 15, fontWeight: '600' },
  folderCount: { color: '#8CA0C6', fontSize: 13 },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B2A47',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  searchRowText: { color: 'white', fontSize: 15, flex: 1, marginRight: 8 },
  searchRowStars: { color: '#F5C518', fontSize: 13 },
  emptyText: { color: '#8CA0C6', textAlign: 'center', marginTop: 24 },
  permissionText: { color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
  permissionButton: { backgroundColor: '#F5C518', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  permissionButtonText: { color: '#0F1729', fontWeight: '700' },
});
