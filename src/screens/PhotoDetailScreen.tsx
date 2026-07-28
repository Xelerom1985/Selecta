import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { usePhotoLibrary } from '../lib/PhotoLibraryContext';
import StarRating from '../components/StarRating';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoDetail'>;

export default function PhotoDetailScreen({ route, navigation }: Props) {
  const { assetIds, index } = route.params;
  const { assetsById, getMeta, rate, rename } = usePhotoLibrary();
  const assetId = assetIds[index];
  const asset = assetsById.get(assetId);
  const meta = getMeta(assetId);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(meta.customName ?? '');
  const [shareUri, setShareUri] = useState<string | null>(null);

  useEffect(() => {
    setNameDraft(getMeta(assetId).customName ?? '');
    setEditingName(false);
    setShareUri(null);
  }, [assetId]);

  useEffect(() => {
    let cancelled = false;
    MediaLibrary.getAssetInfoAsync(assetId).then((info) => {
      if (!cancelled) setShareUri(info.localUri ?? info.uri);
    });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (!asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Foto no encontrada.</Text>
      </View>
    );
  }

  const goTo = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= assetIds.length) return;
    navigation.setParams({ index: newIndex });
  };

  const saveName = async () => {
    await rename(assetId, nameDraft.trim());
    setEditingName(false);
  };

  const handleShare = async () => {
    if (!shareUri) return;
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
      return;
    }
    await Sharing.shareAsync(shareUri);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: shareUri ?? asset.uri }} style={styles.image} resizeMode="contain" />

      <View style={styles.nameRow}>
        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Nombre de la foto"
            placeholderTextColor="#888"
            autoFocus
            onSubmitEditing={saveName}
            onBlur={saveName}
          />
        ) : (
          <TouchableOpacity style={styles.nameDisplay} onPress={() => setEditingName(true)}>
            <Text style={styles.nameText} numberOfLines={1}>
              {meta.customName || 'Sin nombre — toca para editar'}
            </Text>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.starsWrap}>
        <StarRating rating={meta.rating} onRate={(r) => rate(assetId, r)} />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.navButton} onPress={() => goTo(index - 1)} disabled={index === 0}>
          <Text style={[styles.navButtonText, index === 0 && styles.disabled]}>‹ Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => goTo(index + 1)}
          disabled={index === assetIds.length - 1}
        >
          <Text style={[styles.navButtonText, index === assetIds.length - 1 && styles.disabled]}>
            Siguiente ›
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1729' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { flex: 1, backgroundColor: '#000' },
  nameRow: { paddingHorizontal: 16, paddingTop: 12 },
  nameDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { color: 'white', fontSize: 16, flex: 1 },
  editIcon: { color: '#8CA0C6', fontSize: 16, marginLeft: 8 },
  nameInput: {
    backgroundColor: '#1B2A47',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  starsWrap: { alignItems: 'center', paddingVertical: 14 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: { paddingVertical: 10, paddingHorizontal: 8 },
  navButtonText: { color: '#F5C518', fontSize: 15, fontWeight: '600' },
  disabled: { color: '#3A4A6B' },
  shareButton: { backgroundColor: '#F5C518', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  shareButtonText: { color: '#0F1729', fontWeight: '700' },
  emptyText: { color: '#8CA0C6' },
});
