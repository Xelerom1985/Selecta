import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { usePhotoLibrary } from '../lib/PhotoLibraryContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Folder'>;

const NUM_COLUMNS = 3;

export default function FolderScreen({ route, navigation }: Props) {
  const { assetIds, title } = route.params;
  const { assetsById } = usePhotoLibrary();

  navigation.setOptions({ title });

  const items = useMemo(
    () => assetIds.map((id) => assetsById.get(id)).filter((a): a is NonNullable<typeof a> => !!a),
    [assetIds, assetsById]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        initialNumToRender={21}
        maxToRenderPerBatch={21}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.thumbWrap}
            onPress={() => navigation.navigate('PhotoDetail', { assetIds, index })}
          >
            <Image source={{ uri: item.uri }} style={styles.thumb} resizeMethod="resize" resizeMode="cover" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay fotos en esta carpeta.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1729' },
  grid: { padding: 4 },
  thumbWrap: { flex: 1 / NUM_COLUMNS, aspectRatio: 1, padding: 2 },
  thumb: { flex: 1, borderRadius: 6, backgroundColor: '#1B2A47' },
  emptyText: { color: '#8CA0C6', textAlign: 'center', marginTop: 40 },
});
