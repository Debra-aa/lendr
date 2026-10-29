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
import { CLAIM_STATUS_LENDER, CLAIM_STATUS_RENTER, claimCountdown, claimHoursLeft } from '../../lib/claims';
import {
  DAMAGE_REASON_LABELS,
  type Booking, type BookingStatus, type DamageClaim, type DepositReturn, type HandoffKind, type ProfileContact, type ReportTarget,
} from '../../types/database';
import { DamageClaimSheet } from '../../components/DamageClaimSheet';
import { HandoffPhotos } from '../../components/HandoffPhotos';
import { ItemTag } from '../../components/ItemTag';
import { ReportSheet } from '../../components/ReportSheet';
import { StatusBadge } from '../../components/StatusBadge';
import { TopBar, useHideOnScroll } from '../../components/TopBar';
import { Button, Empty, Field, Title, shared } from '../../components/ui';
import { confirmAction, notify } from '../../lib/confirm';

type Side = 'borrowing' | 'lending';

// What each side sees once the renter has answered about the deposit.
const DEPOSIT_LINE_RENTER: Record<DepositReturn, string> = {
  full: 'Deposit returned',
  partial: 'Part of deposit returned',
  none: 'Deposit not returned (reported)',
};
const DEPOSIT_LINE_LENDER: Record<DepositReturn, string> = {
  full: 'Renter confirmed the deposit was returned',
  partial: 'Renter says part of the deposit was returned',
  none: 'Renter says the deposit was not returned (reported)',
};

// Contact details are shared once a rental is approved, until the item is returned.
const SHARES_CONTACT: BookingStatus[] = ['approved', 'active'];

export default function RentalsScreen() {
  const userId = useUserId();
  const { hidden: barHidden, onScroll } = useHideOnScroll();
  const [side, setSide] = useState<Side>('borrowing');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, ProfileContact>>({});
  const [handingOff, setHandingOff] = useState<string | null>(null); // booking id being photographed
  const [answeringDeposit, setAnsweringDeposit] = useState<string | null>(null); // booking id
  const [claims, setClaims] = useState<Record<string, DamageClaim>>({}); // by booking id
  const [claimFor, setClaimFor] = useState<Booking | null>(null); // lender filling in the claim form
  const [claimComments, setClaimComments] = useState<Record<string, string>>({}); // renter comment by claim id
  const [respondingClaim, setRespondingClaim] = useState<string | null>(null); // claim id

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
    const completedIds = list.filter((b) => b.status === 'completed').map((b) => b.id);
    const [urls, contactResult, claimResult] = await Promise.all([
      signedHandoffUrls(paths),
      people.length
        ? supabase.from('profile_contacts').select('user_id, contact_type, contact_value').in('user_id', people)
        : Promise.resolve({ data: [] as ProfileContact[] }),
      completedIds.length
        ? supabase.from('damage_claims').select('*').in('booking_id', completedIds)
        : Promise.resolve({ data: [] as DamageClaim[] }),
    ]);
    setPhotoUrls(urls);
    const byUser: Record<string, ProfileContact> = {};
    for (const c of (contactResult.data ?? []) as ProfileContact[]) byUser[c.user_id] = c;
    setContacts(byUser);
    const byBooking: Record<string, DamageClaim> = {};
    for (const c of (claimResult.data ?? []) as DamageClaim[]) byBooking[c.booking_id] = c;
    setClaims(byBooking);
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

  /**
   * The renter's one-time answer about the deposit. The database records the time,
   * refuses a second answer, and files a deposit dispute report for 'none'.
   */
  async function answerDeposit(booking: Booking, answer: DepositReturn) {
    if (answer === 'none') {
      const confirmed = await confirmAction(
        `Report that you didn't get your ${money(booking.deposit_cents)} deposit back?`,
        'We’ll look into it within 24 hours.',
        'Report',
      );
      if (!confirmed) return;
    }
    setAnsweringDeposit(booking.id);
    const { error } = await supabase.from('bookings').update({ deposit_return: answer }).eq('id', booking.id);
    setAnsweringDeposit(null);
    if (error) notify('Answer not saved', error.message);
    else loadBookings();
  }

  // Borrowing side, completed rentals: ask about the deposit, or show the answer.
  function depositForRenter(b: Booking) {
    if (b.deposit_cents <= 0) return null;
    // A pending or accepted damage claim already answers the deposit question.
    const claim = claims[b.id];
    if (claim && (claim.status === 'pending' || claim.status === 'accepted')) return null;
    if (!b.deposit_return) {
      const busy = answeringDeposit === b.id;
      return (
        <View style={styles.depositCard}>
          <Text style={styles.depositQuestion}>Did you get your {money(b.deposit_cents)} deposit back?</Text>
          <View style={styles.depositButtons}>
            <Button small label="Yes, all of it" disabled={busy} onPress={() => answerDeposit(b, 'full')} />
            <Button small variant="ghost" label="Part of it" disabled={busy} onPress={() => answerDeposit(b, 'partial')} />
            <Button small variant="ghost" label="No" disabled={busy} onPress={() => answerDeposit(b, 'none')} />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.depositAnswered}>
        <Text style={styles.depositLine}>{DEPOSIT_LINE_RENTER[b.deposit_return]}</Text>
        {b.deposit_return === 'partial' && b.listings ? (
          <Button
            small
            variant="ghost"
            label="Report a problem"
            onPress={() => setReportTarget({ booking_id: b.id, reported_user_id: b.listings!.owner_id })}
          />
        ) : null}
      </View>
    );
  }

  /** Renter accepts or disputes a pending claim, once. A dispute files a report automatically. */
  async function respondToClaim(claim: DamageClaim, status: 'accepted' | 'disputed') {
    if (status === 'disputed') {
      const confirmed = await confirmAction('Dispute this claim?', 'We’ll review the photos and decide within 24 hours.', 'Dispute');
      if (!confirmed) return;
    }
    setRespondingClaim(claim.id);
    const comment = (claimComments[claim.id] ?? '').trim();
    const { error } = await supabase
      .from('damage_claims')
      .update({ status, renter_response: comment || null })
      .eq('id', claim.id);
    setRespondingClaim(null);
    if (error) notify('Response not saved', error.message);
    else loadBookings();
  }

  async function withdrawClaim(claim: DamageClaim) {
    if (!(await confirmAction('Withdraw this claim?', 'The renter will no longer be asked about it.', 'Withdraw'))) return;
    const { error } = await supabase.from('damage_claims').delete().eq('id', claim.id);
    if (error) notify('Could not withdraw', error.message);
    else loadBookings();
  }

  // Borrowing side: a pending claim gets a highlighted card; an answered one a short line.
  function claimForRenter(b: Booking) {
    const claim = claims[b.id];
    if (!claim) return null;
    const reasonLabel = DAMAGE_REASON_LABELS[claim.reason];
    if (claim.status !== 'pending') {
      return (
        <Text style={styles.depositLine}>
          {reasonLabel} claim for {money(claim.amount_kept_cents)}: {CLAIM_STATUS_RENTER[claim.status]}
        </Text>
      );
    }
    const busy = respondingClaim === claim.id;
    return (
      <View style={styles.claimCard}>
        <Text style={styles.claimTitle}>
          {firstName(b.listings?.profiles?.full_name)} is keeping {money(claim.amount_kept_cents)} of your deposit: {reasonLabel}
        </Text>
        <Text style={styles.claimDetails}>{claim.details}</Text>
        <HandoffPhotos photos={b.booking_photos} urls={photoUrls} includeDamage />
        <Field
          label="Your comment (optional)"
          value={claimComments[claim.id] ?? ''}
          onChangeText={(text) => setClaimComments((all) => ({ ...all, [claim.id]: text }))}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          placeholder="Anything Lendr should know"
        />
        <View style={styles.depositButtons}>
          <Button small label="Accept" disabled={busy} onPress={() => respondToClaim(claim, 'accepted')} />
          <Button small variant="ghost" label="Dispute" disabled={busy} onPress={() => respondToClaim(claim, 'disputed')} />
        </View>
      </View>
    );
  }

  // Lending side, completed rentals with a deposit: the filed claim, or the button while the window is open.
  function claimForLender(b: Booking) {
    if (b.deposit_cents <= 0) return null;
    const claim = claims[b.id];
    if (claim) {
      return (
        <View style={styles.claimSummary}>
          <Text style={styles.claimSummaryTitle}>
            Keeping {money(claim.amount_kept_cents)} of {money(b.deposit_cents)}: {DAMAGE_REASON_LABELS[claim.reason]}
          </Text>
          <Text style={styles.depositLine}>{CLAIM_STATUS_LENDER[claim.status]}</Text>
          {claim.renter_response ? <Text style={styles.depositLine}>Renter: “{claim.renter_response}”</Text> : null}
          {claim.status === 'pending' ? (
            <Button small variant="ghost" label="Withdraw" onPress={() => withdrawClaim(claim)} style={{ alignSelf: 'flex-start' }} />
          ) : null}
        </View>
      );
    }
    const hours = claimHoursLeft(b);
    if (hours <= 0) return null;
    return (
      <View style={styles.claimOffer}>
        <Button small variant="ghost" label="Report a problem" onPress={() => setClaimFor(b)} />
        <Text style={styles.depositLine}>{claimCountdown(hours)}</Text>
      </View>
    );
  }

  function actions(b: Booking) {
    if (side === 'borrowing') {
      if (b.status === 'requested' || b.status === 'approved') {
        return <Button small variant="ghost" label="Cancel request" onPress={() => setStatus(b, 'cancelled')} />;
      }
      if (b.status === 'completed') {
        return (
          <View>
            {claimForRenter(b)}
            {depositForRenter(b)}
            {b.reviews.length === 0 ? (
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
            ) : null}
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
        // The renter's deposit answer, and their review of this item if they left one.
        return (
          <View>
            {claimForLender(b)}
            {b.deposit_return ? <Text style={styles.depositLine}>{DEPOSIT_LINE_LENDER[b.deposit_return]}</Text> : null}
            {b.reviews.length > 0 ? (
              <Button
                small
                variant="ghost"
                label="Report review"
                onPress={() => setReportTarget({ review_id: b.reviews[0].id, reported_user_id: b.renter_id })}
              />
            ) : null}
          </View>
        );
      default:
        return null;
    }
  }

  return (
    <View style={shared.screen}>
      <TopBar hidden={barHidden} />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
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
                {side === 'borrowing' && claims[b.id]?.status === 'pending' ? null : (
                  <HandoffPhotos photos={b.booking_photos} urls={photoUrls} includeDamage={!!claims[b.id]} />
                )}
                <View style={{ marginTop: 8 }}>{actions(b)}</View>
              </View>
            </View>
          );
        })}
        <DamageClaimSheet booking={claimFor} onClose={() => setClaimFor(null)} onFiled={loadBookings} />
        <ReportSheet
          target={reportTarget}
          title={reportTarget?.booking_id ? 'Report a problem' : 'Report review'}
          initialReason={reportTarget?.booking_id ? 'deposit_dispute' : undefined}
          onClose={() => setReportTarget(null)}
        />
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
  segSelected: { backgroundColor: colors.mint },
  segText: { fontWeight: '700', color: colors.muted },
  row: { flexDirection: 'row', gap: 12 },
  mini: { width: 56 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  buttons: { flexDirection: 'row', gap: 8 },
  stars: { flexDirection: 'row', gap: 4, marginTop: 4 },
  depositCard: {
    backgroundColor: colors.raised, borderRadius: radius.md, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: colors.line,
  },
  depositQuestion: { fontSize: 15, fontWeight: '700', color: colors.ink },
  depositButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  depositAnswered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  claimCard: {
    backgroundColor: colors.raised, borderRadius: radius.md, padding: 12, marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.danger,
  },
  claimTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  claimDetails: { fontSize: 14, color: colors.ink, marginTop: 6, lineHeight: 20 },
  claimSummary: { marginBottom: 10, gap: 2 },
  claimSummaryTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  claimOffer: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  depositLine: { fontSize: 13, color: colors.muted, flexShrink: 1, marginBottom: 6 },
  contact: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
  },
  contactText: { flex: 1, color: colors.ink, fontSize: 14 },
  contactAction: { color: colors.mint, fontWeight: '700', fontSize: 14 },
  noContact: { color: colors.muted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
});
