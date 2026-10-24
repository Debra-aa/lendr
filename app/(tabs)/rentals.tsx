import { useCallback, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { BOOKING_SELECT } from '../../lib/queries';
import { firstName, money, shortDate } from '../../lib/format';
import { CONTACT_INFO, contactUrl } from '../../lib/contacts';
import { chooseSource, pickHandoffPhoto, saveHandoffPhoto, signedHandoffUrls } from '../../lib/handoff';
import { errorMessage } from '../../lib/moderation';
import { colors, radius } from '../../lib/theme';
import type { Booking, BookingStatus, HandoffKind, ProfileContact, ReportTarget } from '../../types/database';
import { HandoffPhotos } from '../../components/HandoffPhotos';
import { ItemTag } from '../../components/ItemTag';
import { ReportSheet } from '../../components/ReportSheet';
import { StatusBadge } from '../../components/StatusBadge';
import { TopBar } from '../../components/TopBar';
import { Button, Empty, Title, shared } from '../../components/ui';
import { notify } from '../../lib/confirm';

type Side = 'borrowing' | 'lending';

// Contact details are shared once a rental is approved, until the item is returned.
const SHARES_CONTACT: BookingStatus[] = ['approved', 'active'];

export default function RentalsScreen() {
  const userId = useUserId();
  const [side, setSide] = useState<Side>('borrowing');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, ProfileContact>>({});
  const [handingOff, setHandingOff] = useState<string | null>(null); // booking id being photographed

  // The other person on a rental: the owner when I'm borrowing, the renter when I'm lending.
  const otherPerson = useCallback(
    (b: Booking) => (side === 'borrowing' ? b.listings?.owner_id : b.renter_id) ?? null,
    [side],
  );

  const loadBookings = useCallback(async () => {
    let query = supabase.from('bookings').select(BOOKING_SELECT).order('created_at', { ascending: false });
    query = side === 'borrowing' ? query.eq('renter_id', userId) : query.eq('listings.owner_id', userId);
    const { data, error } = await query;
    if (error) {
      notify('Could not load rentals', error.message);
      return;
    }
    const list = data as Booking[];
    setBookings(list);

    // The photo bucket is private, so get signed URLs, and fetch contacts the database lets me see.
    const paths = list.flatMap((b) => b.booking_photos.map((p) => p.storage_path));
    const people = [...new Set(list.filter((b) => SHARES_CONTACT.includes(b.status)).map(otherPerson).filter((id): id is string => !!id))];
    const [urls, contactResult] = await Promise.all([
      signedHandoffUrls(paths),
      people.length
        ? supabase.from('profile_contacts').select('user_id, contact_type, contact_value').in('user_id', people)
        : Promise.resolve({ data: [] as ProfileContact[] }),
    ]);
    setPhotoUrls(urls);
    const byUser: Record<string, ProfileContact> = {};
    for (const c of (contactResult.data ?? []) as ProfileContact[]) byUser[c.user_id] = c;
    setContacts(byUser);
  }, [side, userId, otherPerson]);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  async function refresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  // The database only allows valid status changes, so any mistake comes back as an error message.
  async function setStatus(booking: Booking, status: BookingStatus) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    if (error) notify('Could not update', error.message);
    else loadBookings();
  }

  /**
   * Mark picked up / Mark returned: the database needs a photo first. If a photo
   * was already saved (say the status update failed last time), skip straight to the update.
   */
  async function handOff(booking: Booking, kind: HandoffKind) {
    const next: BookingStatus = kind === 'pickup' ? 'active' : 'completed';
    if (!booking.booking_photos.some((p) => p.kind === kind)) {
      const source = await chooseSource(kind === 'pickup' ? 'Photo at pickup' : 'Photo at return');
      if (!source) return;
      const asset = await pickHandoffPhoto(source);
      if (!asset) return;
      setHandingOff(booking.id);
      try {
        await saveHandoffPhoto(booking.id, kind, asset);
      } catch (e) {
        setHandingOff(null);
        notify('Photo not saved', errorMessage(e));
        return;
      }
    } else {
      setHandingOff(booking.id);
    }
    await setStatus(booking, next);
    setHandingOff(null);
  }

  function openContact(c: ProfileContact) {
    const url = contactUrl(c.contact_type, c.contact_value);
    if (!url) return;
    Linking.openURL(url).catch(() => notify('Could not open', `Reach them at ${c.contact_value}.`));
  }

  function contactLine(b: Booking) {
    if (!SHARES_CONTACT.includes(b.status)) return null;
    const person = otherPerson(b);
    const c = person ? contacts[person] : undefined;
    if (!c) return <Text style={styles.noContact}>They haven't added a contact yet.</Text>;
    const info = CONTACT_INFO[c.contact_type];
    const tappable = contactUrl(c.contact_type, c.contact_value) !== null;
    return (
      <Pressable
        onPress={() => openContact(c)}
        disabled={!tappable}
        accessibilityRole={tappable ? 'link' : 'text'}
        accessibilityLabel={tappable ? `${info.action} ${c.contact_value}` : `${info.label}: ${c.contact_value}`}
        style={styles.contact}
      >
        <MaterialCommunityIcons name={info.icon} size={18} color={colors.mint} />
        <Text style={styles.contactText} numberOfLines={1} selectable={!tappable}>
          {info.label}: {c.contact_value}
        </Text>
        {tappable ? <Text style={styles.contactAction}>{info.action}</Text> : null}
      </Pressable>
    );
  }

  async function review(booking: Booking, rating: number) {
    const { error } = await supabase.from('reviews').insert({ booking_id: booking.id, rating });
    if (error) notify('Review not saved', error.message);
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
            <Button small label="Mark picked up" busy={handingOff === b.id} onPress={() => handOff(b, 'pickup')} />
            <Button small variant="ghost" label="Cancel" onPress={() => setStatus(b, 'cancelled')} />
          </View>
        );
      case 'active':
        return <Button small label="Mark returned" busy={handingOff === b.id} onPress={() => handOff(b, 'return')} />;
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
    <View style={shared.screen}>
      <TopBar />
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
                {contactLine(b)}
                <HandoffPhotos photos={b.booking_photos} urls={photoUrls} />
                <View style={{ marginTop: 8 }}>{actions(b)}</View>
              </View>
            </View>
          );
        })}
        <ReportSheet target={reportTarget} title="Report review" onClose={() => setReportTarget(null)} />
      </ScrollView>
    </View>
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
  contact: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
  },
  contactText: { flex: 1, color: colors.ink, fontSize: 14 },
  contactAction: { color: colors.mint, fontWeight: '700', fontSize: 14 },
  noContact: { color: colors.muted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
});
