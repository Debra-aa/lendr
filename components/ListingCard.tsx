// A listing in the Browse grid: rounded box with a thin black rim and a solid offset shadow.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { money } from '../lib/format';
import { colors } from '../lib/theme';
import type { Listing } from '../types/database';
import { ItemTag } from './ItemTag';

export function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const where = listing.pickup_location || listing.profiles?.campus || 'On campus';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.outer}>
      {({ pressed }) => (
        <>
          {/* The black box behind the card acts as the offset shadow on both iOS and Android. */}
          <View style={[styles.shadow, pressed && { top: 1, left: 1 }]} />
          <View style={[styles.card, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}>
            <ItemTag
              id={listing.id}
              category={listing.category}
              images={listing.listing_images}
              priceLabel={`${money(listing.price_cents_per_day)}/day`}
            />
            <Text style={styles.name} numberOfLines={2}>{listing.title}</Text>
            <Text style={styles.where} numberOfLines={1}>{where}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, paddingRight: 3, paddingBottom: 3 },
  shadow: { position: 'absolute', top: 3, left: 3, right: 0, bottom: 0, backgroundColor: colors.rim, borderRadius: 14 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rim, borderRadius: 14, padding: 8, paddingBottom: 10 },
  name: { fontWeight: '700', fontSize: 15, color: colors.ink, marginTop: 8 },
  where: { color: colors.muted, fontSize: 13 },
});
