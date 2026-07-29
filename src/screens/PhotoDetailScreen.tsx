import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, PanResponder, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { usePhotoLibrary } from '../lib/PhotoLibraryContext';
import StarRating from '../components/StarRating';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoDetail'>;

const SWIPE_THRESHOLD = 60;

export default function PhotoDetailScreen({ route, navigation }: Props) {
  const { assetIds, index } = route.params;
  const { assetsById, getMeta, rate, rename } = usePhotoLibrary();
  const insets = useSafeAreaInsets();
  const assetId = assetIds[index];
  const asset = assetsById.get(assetId);
  const meta = getMeta(assetId);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(meta.customName ?? '');

  useEffect(() => {
    setNameDraft(getMeta(assetId).customName ?? '');
    setEditingName(false);
  }, [assetId]);

  const goTo = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= assetIds.length) return;
    navigation.setParams({ index: newIndex });
  };

  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) goTo(indexRef.current + 1);
        else if (gesture.dx >= SWIPE_THRESHOLD) goTo(indexRef.current - 1);
      },
    })
  ).current;

  if (!asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Foto no encontrada.</Text>
      </View>
    );
  }

  const saveName = async () => {
    await rename(assetId, nameDraft.trim());
    setEditingName(false);
  };

  const handleShare = async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
        return;
      }
      const shareUri =
        Platform.OS === 'android' ? await MediaLibrary.getAssetContentUriAsync(asset.id) : asset.uri;
      await Sharing.shareAsync(shareUri);
    } catch (err: any) {
      Alert.alert('No se pudo compartir', err?.message ?? String(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap} {...panResponder.panHandlers}>
        <Image source={{ uri: asset.uri }} style={styles.image} resizeMode="contain" />
      </View>

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

      <View style={[styles.actionsRow, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1729' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrap: { flex: 1 },
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  shareButton: {
    backgroundColor: '#F5C518',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  shareButtonText: { color: '#0F1729', fontWeight: '700' },
  emptyText: { color: '#8CA0C6' },
});
