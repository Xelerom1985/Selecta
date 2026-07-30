import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, PanResponder, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
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
  const { assetsById, getMeta, rate, rename, markForDelete, pendingDeleteAssets } = usePhotoLibrary();
  const pendingDeleteCount = pendingDeleteAssets.length;
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

  const handleFinish = useCallback(() => {
    if (pendingDeleteCount === 0) {
      Alert.alert('Nada para eliminar', 'Todavía no marcaste ninguna foto con la cruz roja.');
      return;
    }
    navigation.navigate('ConfirmDelete');
  }, [pendingDeleteCount, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.finishText}>
            Terminar por ahora{pendingDeleteCount > 0 ? ` (${pendingDeleteCount})` : ''}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleFinish, pendingDeleteCount]);

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
      let shareUri = asset.uri;
      if (Platform.OS === 'android') {
        const contentUri = await MediaLibrary.getAssetContentUriAsync(asset.id);
        const dest = `${FileSystem.cacheDirectory}${asset.filename}`;
        await FileSystem.copyAsync({ from: contentUri, to: dest });
        shareUri = dest;
      }
      await Sharing.shareAsync(shareUri);
    } catch (err: any) {
      Alert.alert('No se pudo compartir', err?.message ?? String(err));
    }
  };

  const decide = async (pending: boolean) => {
    await markForDelete(assetId, pending);
    goTo(index + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap} {...panResponder.panHandlers}>
        <Image source={{ uri: asset.uri }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.decisionRow}>
        <TouchableOpacity
          style={[styles.decisionButton, meta.pendingDelete && styles.decisionButtonActiveDelete]}
          onPress={() => decide(true)}
        >
          <Text style={styles.decisionIcon}>❌</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.decisionButton} onPress={() => decide(false)}>
          <Text style={styles.decisionIcon}>💚</Text>
        </TouchableOpacity>
      </View>
      {meta.pendingDelete && <Text style={styles.pendingDeleteText}>Marcada para eliminar</Text>}

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
  finishText: { color: '#F5C518', fontWeight: '600', fontSize: 13 },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    paddingTop: 14,
  },
  decisionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1B2A47',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  decisionButtonActiveDelete: { borderColor: '#E5484D' },
  decisionIcon: { fontSize: 26 },
  pendingDeleteText: { color: '#E5484D', textAlign: 'center', fontSize: 12, marginTop: 6 },
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
