// A listing in the Browse grid and on Profile: square photo, then title, price,
// and one line with the condition and pickup spot. Kept plain, like a shopping site.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { money } from '../lib/format';
import { colors, iconFor } from '../lib/theme';
import { CONDITION_LABELS, type Listing } from '../types/database';
import { firstPhoto } from './ItemTag';

const PHOTO_BG = colors.card;

export function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const photo = firstPhoto(listing.listing_images);
  const where = listing.pickup_location || listing.profiles?.campus || 'On campus';
  const details = [listing.condition ? CONDITION_LABELS[listing.condition] : null, where].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${money(listing.price_cents_per_day)} a day`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.photo}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={iconFor(listing.category)} size={44} color={colors.muted} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
      <Text style={styles.price}>
        {money(listing.price_cents_per_day)}
        <Text style={styles.perDay}>/day</Text>
      </Text>
      <Text style={styles.details} numberOfLines={1}>{details}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  photo: {
    aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: PHOTO_BG,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, color: colors.ink, marginTop: 8 },
  price: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 4 },
  perDay: { fontSize: 13, fontWeight: '400', color: colors.muted },
  details: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
