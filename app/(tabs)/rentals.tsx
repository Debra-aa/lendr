import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { BOOKING_SELECT } from '../../lib/queries';
import { firstName, money, shortDate } from '../../lib/format';
import { colors, radius } from '../../lib/theme';
import type { Booking, BookingStatus, ReportTarget } from '../../types/database';
import { ItemTag } from '../../components/ItemTag';
import { ReportSheet } from '../../components/ReportSheet';
import { StatusBadge } from '../../components/StatusBadge';
import { Button, Empty, Title, shared } from '../../components/ui';

type Side = 'borrowing' | 'lending';

export default function RentalsScreen() {
  const userId = useUserId();
  const [side, setSide] = useState<Side>('borrowing');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const loadBookings = useCallback(async () => {
    let query = supabase.from('bookings').select(BOOKING_SELECT).order('created_at', { ascending: false });
    query = side === 'borrowing' ? query.eq('renter_id', userId) : query.eq('listings.owner_id', userId);
    const { data, error } = await query;
    if (error) Alert.alert('Could not load rentals', error.message);
    else setBookings(data as Booking[]);
  }, [side, userId]);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  async function refresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  // The database only allows valid status changes, so any mistake comes back as an error message.
  async function setStatus(booking: Booking, status: BookingStatus) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    if (error) Alert.alert('Could not update', error.message);
    else loadBookings();
  }

  async function review(booking: Booking, rating: number) {
    const { error } = await supabase.from('reviews').insert({ booking_id: booking.id, rating });
    if (error) Alert.alert('Review not saved', error.message);
    else loadBookings();
  }

  function actions(b: Booking) {
    if (side === 'borrowing') {
      if (b.status === 'requested' || b.status === 'approved') {
        return <Button small variant="ghost" label="Cancel request" onPress={() => setStatus(b, 'cancelled')} />;
      }
      if (b.status === 'completed' && b.reviews.length === 0) {
        return (
          <View>
            <Text style={shared.muted}>How did it go?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} onPress={() => review(b, n)} hitSlop={6}>
                  <MaterialCommunityIcons name="star-outline" size={28} color={colors.mint} />
                </Pressable>
              ))}
            </View>
          </View>
        );
      }
      return null;
    }

    // Lending side: the owner moves the rental forward.
    switch (b.status) {
      case 'requested':
        return (
          <View style={styles.buttons}>
            <Button small label="Approve" onPress={() => setStatus(b, 'approved')} />
            <Button small variant="ghost" label="Decline" onPress={() => setStatus(b, 'declined')} />
          </View>
        );
      case 'approved':
        return (
          <View style={styles.buttons}>
            <Button small label="Mark picked up" onPress={() => setStatus(b, 'active')} />
            <Button small variant="ghost" label="Cancel" onPress={() => setStatus(b, 'cancelled')} />
          </View>
        );
      case 'active':
        return <Button small label="Mark returned" onPress={() => setStatus(b, 'completed')} />;
      case 'completed':
        // The renter's review of this item, if they left one.
        if (b.reviews.length === 0) return null;
        return (
          <Button
            small
            variant="ghost"
            label="Report review"
            onPress={() => setReportTarget({ review_id: b.reviews[0].id, reported_user_id: b.renter_id })}
          />
        );
      default:
        return null;
    }
  }

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mint} />}
    >
      <Title>My rentals</Title>

      <View style={styles.segment}>
        {(['borrowing', 'lending'] as Side[]).map((s) => (
          <Pressable key={s} onPress={() => setSide(s)} style={[styles.segButton, side === s && styles.segSelected]} accessibilityState={{ selected: side === s }}>
            <Text style={[styles.segText, side === s && { color: '#fff' }]}>{s === 'borrowing' ? 'Borrowing' : 'Lending'}</Text>
          </Pressable>
        ))}
      </View>

      {bookings.length === 0 ? (
        <Empty message={side === 'borrowing' ? 'Nothing here yet. Browse items to borrow your first one.' : 'No requests for your items yet.'} />
      ) : null}

      {bookings.map((b) => {
        const item = b.listings;
        const who = side === 'borrowing'
          ? `From ${firstName(item?.profiles?.full_name)}`
          : `${firstName(b.profiles?.full_name)} wants to borrow it`;
        return (
          <View key={b.id} style={[shared.box, styles.row]}>
            <ItemTag id={b.listing_id} category={item?.category ?? null} images={item?.listing_images} style={styles.mini} iconSize={24} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.itemTitle}>{item?.title}</Text>
              <Text style={shared.muted}>{who}</Text>
              <Text style={shared.muted}>
                {shortDate(b.start_date)} to {shortDate(b.end_date)}, {money(b.total_cents)} plus {money(b.deposit_cents)} deposit
              </Text>
              <StatusBadge status={b.status} />
              <View style={{ marginTop: 8 }}>{actions(b)}</View>
            </View>
          </View>
        );
      })}
      <ReportSheet target={reportTarget} title="Report review" onClose={() => setReportTarget(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 4, marginBottom: 14,
  },
  segButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  segSelected: { backgroundColor: colors.ink },
  segText: { fontWeight: '700', color: colors.muted },
  row: { flexDirection: 'row', gap: 12 },
  mini: { width: 56 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  buttons: { flexDirection: 'row', gap: 8 },
  stars: { flexDirection: 'row', gap: 4, marginTop: 4 },
});
