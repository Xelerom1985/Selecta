import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { usePhotoLibrary } from '../lib/PhotoLibraryContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmDelete'>;

const NUM_COLUMNS = 3;

export default function ConfirmDeleteScreen({ navigation }: Props) {
  const { pendingDeleteAssets, markForDelete, confirmDeletions } = usePhotoLibrary();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(pendingDeleteAssets.map((a) => a.id))
  );
  const [busy, setBusy] = useState(false);

  const selectedCount = selected.size;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (selectedCount === 0) {
      Alert.alert('Nada seleccionado', 'Destildaste todas las fotos, no hay nada para eliminar.');
      return;
    }
    setBusy(true);
    try {
      const toDelete = pendingDeleteAssets.filter((a) => selected.has(a.id)).map((a) => a.id);
      const toKeep = pendingDeleteAssets.filter((a) => !selected.has(a.id)).map((a) => a.id);
      await Promise.all(toKeep.map((id) => markForDelete(id, false)));
      const count = await confirmDeletions(toDelete);
      Alert.alert('Listo', `${count} foto${count === 1 ? '' : 's'} enviada${count === 1 ? '' : 's'} a la papelera.`);
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('No se pudo completar', err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const listData = useMemo(() => pendingDeleteAssets, [pendingDeleteAssets]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Tocá una foto para sacarla de la lista si no querés eliminarla.
      </Text>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.thumbWrap} onPress={() => toggle(item.id)}>
              <Image
                source={{ uri: item.uri }}
                style={[styles.thumb, !isSelected && styles.thumbDeselected]}
              />
              <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeDeselected]}>
                <Text style={styles.badgeText}>{isSelected ? '✕' : '↩'}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay fotos marcadas para eliminar.</Text>}
      />

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.deleteButton, (selectedCount === 0 || busy) && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={selectedCount === 0 || busy}
        >
          <Text style={styles.deleteButtonText}>
            {busy ? 'Enviando...' : `Eliminar (${selectedCount})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1729' },
  subtitle: { color: '#8CA0C6', fontSize: 13, paddingHorizontal: 16, paddingVertical: 12 },
  grid: { padding: 4 },
  thumbWrap: { flex: 1 / NUM_COLUMNS, aspectRatio: 1, padding: 2 },
  thumb: { flex: 1, borderRadius: 6, backgroundColor: '#1B2A47' },
  thumbDeselected: { opacity: 0.35 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: '#E5484D' },
  badgeDeselected: { backgroundColor: '#30A46C' },
  badgeText: { color: 'white', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#8CA0C6', textAlign: 'center', marginTop: 40 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  deleteButton: {
    backgroundColor: '#E5484D',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
