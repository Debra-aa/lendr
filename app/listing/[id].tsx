import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, photoUrl } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { LISTING_SELECT } from '../../lib/queries';
import { addDays, firstName, money, shortDate, toISODate } from '../../lib/format';
import { colors, radius } from '../../lib/theme';
import type { Listing } from '../../types/database';
import { Avatar } from '../../components/Avatar';
import { ItemTag } from '../../components/ItemTag';
import { Button, Empty, shared } from '../../components/ui';

const PICKUP_DAYS = 7;  // how far ahead a renter can choose to start
const MAX_DAYS = 14;    // longest rental from this screen

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useUserId();
  const { width } = useWindowDimensions();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [startOffset, setStartOffset] = useState(1); // days from today
  const [days, setDays] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('listings').select(LISTING_SELECT).eq('id', id).single()
      .then(({ data }) => {
        setListing(data as Listing | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <View style={[shared.screen, styles.center]}><ActivityIndicator color={colors.mint} /></View>;
  if (!listing) return <View style={[shared.screen, shared.content]}><Empty message="This listing was removed or does not exist." /></View>;

  const isMine = listing.owner_id === userId;
  const ownerName = isMine ? 'You' : listing.profiles?.full_name || 'A student';
  const photos = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const start = addDays(new Date(), startOffset);
  const end = addDays(start, days - 1);

  async function requestToBorrow() {
    if (!listing) return;
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      listing_id: listing.id,
      renter_id: userId,
      start_date: toISODate(start),
      end_date: toISODate(end),
      total_cents: 0, // placeholder: the database calculates the real total and deposit
    });
    setBusy(false);
    if (error) {
      Alert.alert('Request not sent', error.message);
      return;
    }
    Alert.alert('Request sent', `${firstName(listing.profiles?.full_name)} will approve or decline it. You can follow it under My rentals.`);
    router.replace('/rentals');
  }

  async function toggleAvailable() {
    if (!listing) return;
    const next = !listing.is_available;
    const { error } = await supabase.from('listings').update({ is_available: next }).eq('id', listing.id);
    if (error) Alert.alert('Could not update', error.message);
    else setListing({ ...listing, is_available: next });
  }

  function confirmDelete() {
    Alert.alert('Delete this listing?', 'Its photos and details will be removed.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('listings').delete().eq('id', listing!.id);
          if (error) Alert.alert('Could not delete', error.message);
          else router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      {photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photos}>
          {photos.map((p) => (
            <Image key={p.storage_path} source={{ uri: photoUrl(p.storage_path) }} style={{ width: width - 40, aspectRatio: 1 }} />
          ))}
        </ScrollView>
      ) : (
        <ItemTag id={listing.id} category={listing.category} style={styles.heroTag} iconSize={80} />
      )}

      <Text style={styles.title}>{listing.title}</Text>
      {listing.description ? <Text style={shared.muted}>{listing.description}</Text> : null}

      <View style={[shared.box, styles.owner]}>
        <Avatar name={ownerName} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bold}>{ownerName}</Text>
          <Text style={shared.muted}>Pickup: {listing.pickup_location || listing.profiles?.campus || 'Arrange with the owner'}</Text>
        </View>
      </View>

      <View style={styles.facts}>
        <View style={[shared.box, styles.fact]}><Text style={shared.muted}>Price</Text><Text style={styles.factValue}>{money(listing.price_cents_per_day)} a day</Text></View>
        <View style={[shared.box, styles.fact]}><Text style={shared.muted}>Deposit</Text><Text style={styles.factValue}>{money(listing.deposit_cents)}</Text></View>
      </View>

      {isMine ? (
        <View>
          <Text style={shared.muted}>
            This is your listing. {listing.is_available ? 'Students can see it and request it.' : 'It is hidden from Browse right now.'}
          </Text>
          <Button label={listing.is_available ? 'Hide from Browse' : 'Show on Browse'} variant="ghost" onPress={toggleAvailable} />
          <Button label="Delete listing" variant="danger" onPress={confirmDelete} />
        </View>
      ) : (
        <View style={shared.box}>
          <Text style={styles.bold}>Pick up</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
            {Array.from({ length: PICKUP_DAYS }, (_, i) => i + 1).map((offset) => {
              const day = addDays(new Date(), offset);
              const selected = offset === startOffset;
              return (
                <Pressable key={offset} onPress={() => setStartOffset(offset)} style={[styles.day, selected && styles.daySelected]}>
                  <Text style={[styles.dayName, selected && styles.dayTextSelected]}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                  <Text style={[styles.dayNum, selected && styles.dayTextSelected]}>{day.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={shared.row}>
            <Text style={styles.bold}>Days</Text>
            <View style={styles.stepper}>
              <Pressable accessibilityLabel="Fewer days" style={styles.step} onPress={() => setDays(Math.max(1, days - 1))}><Text style={styles.stepText}>-</Text></Pressable>
              <Text style={styles.bold}>{days}</Text>
              <Pressable accessibilityLabel="More days" style={styles.step} onPress={() => setDays(Math.min(MAX_DAYS, days + 1))}><Text style={styles.stepText}>+</Text></Pressable>
            </View>
          </View>

          <View style={styles.total}>
            <View style={shared.row}><Text>{shortDate(toISODate(start))} to {shortDate(toISODate(end))}</Text><Text style={styles.bold}>{money(days * listing.price_cents_per_day)}</Text></View>
            <View style={shared.row}><Text>Refundable deposit</Text><Text style={styles.bold}>{money(listing.deposit_cents)}</Text></View>
          </View>
          <Text style={[shared.muted, { marginTop: 8, fontSize: 13 }]}>You only lose the deposit if the item comes back damaged or late.</Text>

          <Button label="Request to borrow" onPress={requestToBorrow} busy={busy} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  photos: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.rim },
  heroTag: { width: 240, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 6 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  bold: { fontWeight: '700', color: colors.ink, fontSize: 16 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1 },
  factValue: { fontSize: 18, fontWeight: '700', color: colors.ink },
  day: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 8, width: 56,
    alignItems: 'center', marginRight: 8, backgroundColor: colors.paper,
  },
  daySelected: { backgroundColor: colors.mint, borderColor: colors.mint },
  dayName: { fontSize: 13, color: colors.muted },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.ink },
  dayTextSelected: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  step: {
    width: 36, height: 36, borderWidth: 1, borderColor: colors.line, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper,
  },
  stepText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  total: { borderTopWidth: 1, borderTopColor: colors.line, borderStyle: 'dashed', marginTop: 12, paddingTop: 10, gap: 6 },
});
