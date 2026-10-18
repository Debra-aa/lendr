// The colored rental tag that shows a listing. Uses the first photo when there
// is one, otherwise a category icon.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { photoUrl } from '../lib/supabase';
import { colors, iconFor, tagColor } from '../lib/theme';
import type { ListingImage } from '../types/database';

type Props = {
  id: string;
  category: string | null;
  images?: ListingImage[];
  priceLabel?: string;
  style?: ViewStyle;
  iconSize?: number;
};

export function firstPhoto(images: ListingImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  const first = [...images].sort((a, b) => a.position - b.position)[0];
  return photoUrl(first.storage_path);
}

export function ItemTag({ id, category, images, priceLabel, style, iconSize = 52 }: Props) {
  const photo = firstPhoto(images);
  return (
    <View style={[styles.tag, { backgroundColor: tagColor(id) }, style]}>
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <MaterialCommunityIcons name={iconFor(category)} size={iconSize} color={colors.ink} style={{ marginTop: 10 }} />
      )}
      <View style={styles.hole} />
      {priceLabel ? (
        <View style={styles.price}>
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    aspectRatio: 1 / 1.1, borderWidth: 1, borderColor: colors.rim, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  hole: {
    position: 'absolute', top: '8%', alignSelf: 'center', width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: 'rgba(20,26,33,0.3)',
  },
  price: {
    position: 'absolute', right: 6, bottom: 6, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.rim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  priceText: { fontWeight: '700', fontSize: 13, color: colors.ink },
});
