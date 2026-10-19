import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { AVATAR_BUCKET, PHOTO_BUCKET, supabase, uploadImage } from '../../lib/supabase';
import { useAuth, useUserId } from '../../lib/auth';
import { LISTING_SELECT } from '../../lib/queries';
import { money } from '../../lib/format';
import { errorMessage, unblockUser } from '../../lib/moderation';
import { colors, radius, type IconName } from '../../lib/theme';
import type { Listing } from '../../types/database';
import { Avatar } from '../../components/Avatar';
import { useShrinkingBanner } from '../../components/Banner';
import { ListingCard } from '../../components/ListingCard';
import { SectionBanner } from '../../components/SectionBanner';
import { Button, Empty, Field, shared } from '../../components/ui';

type Stats = { rating: number | null; points: number; earnedCents: number };
type BlockedUser = { blocked_id: string; profiles: { full_name: string | null; avatar_url: string | null } | null };

function StatTile({ icon, bg, label, value }: { icon: IconName; bg: string; label: string; value: string }) {
  return (
    <View style={[shared.box, styles.stat]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useUserId();
  const { profile, refreshProfile } = useAuth();
  const onScroll = useShrinkingBanner();

  const [fullName, setFullName] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({ rating: null, points: 0, earnedCents: 0 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);

  const load = useCallback(async () => {
    const [listingsResult, lentResult, reviewsResult, blockedResult] = await Promise.all([
      supabase.from('listings').select(LISTING_SELECT).eq('owner_id', userId).order('created_at', { ascending: false }),
      // Rentals of my items that actually happened (picked up or returned).
      supabase.from('bookings').select('status, total_cents, listings!inner(owner_id)')
        .eq('listings.owner_id', userId).in('status', ['active', 'completed']),
      // Reviews renters left on my items.
      supabase.from('reviews').select('rating, bookings!inner(listings!inner(owner_id))')
        .eq('bookings.listings.owner_id', userId),
      // People I blocked. blocks links to profiles twice, so name the foreign key.
      supabase.from('blocks').select('blocked_id, profiles!blocks_blocked_id_fkey(full_name, avatar_url)')
        .eq('blocker_id', userId).order('created_at', { ascending: false }),
    ]);

    if (listingsResult.data) setListings(listingsResult.data as Listing[]);
    if (blockedResult.data) setBlocked(blockedResult.data as unknown as BlockedUser[]);

    const lent = (lentResult.data ?? []) as { status: string; total_cents: number }[];
    const ratings = ((reviewsResult.data ?? []) as { rating: number }[]).map((r) => r.rating);
    setStats({
      // Lendr points: one point for every time someone rented one of my items.
      points: lent.length,
      earnedCents: lent.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.total_cents, 0),
      rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    });
  }, [userId]);

  useFocusEffect(useCallback(() => {
    load();
    refreshProfile();
  }, [load, refreshProfile]));

  // Keep the name box in sync once the profile loads.
  const [nameLoadedFor, setNameLoadedFor] = useState<string | null>(null);
  if (profile && nameLoadedFor !== profile.id) {
    setNameLoadedFor(profile.id);
    setFullName(profile.full_name ?? '');
  }

  async function changePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? 'image/jpeg';
    const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    // New file name each time so phones do not show an old cached photo.
    const path = `${userId}/avatar-${Date.now()}.${extension}`;

    setUploading(true);
    try {
      await uploadImage(AVATAR_BUCKET, path, asset.uri, type);
      const url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
      if (error) throw error;
      await refreshProfile();
    } catch (e) {
      Alert.alert('Photo not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function saveName() {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() || null }).eq('id', userId);
    setSaving(false);
    if (error) Alert.alert('Profile not saved', error.message);
    else {
      await refreshProfile();
      Alert.alert('Profile saved');
    }
  }

  function signOut() {
    Alert.alert('Log out of Lendr?', '', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your profile, listings, photos, rentals and wanted posts. It cannot be undone.',
      [
        { text: 'Keep account', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ],
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      // Photos first: Storage files can't be removed from inside the database.
      // Best effort, so a leftover photo never blocks deleting the account.
      const { data: images } = await supabase
        .from('listing_images').select('storage_path, listings!inner(owner_id)').eq('listings.owner_id', userId);
      const photoPaths = (images ?? []).map((i) => i.storage_path as string);
      if (photoPaths.length) await supabase.storage.from(PHOTO_BUCKET).remove(photoPaths);
      const { data: avatars } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
      if (avatars?.length) await supabase.storage.from(AVATAR_BUCKET).remove(avatars.map((f) => `${userId}/${f.name}`));

      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      // The login no longer exists, so just clear it from this phone.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      setDeleting(false);
      // Shows the database's message, e.g. when a rental is still in progress.
      Alert.alert('Account not deleted', errorMessage(e));
    }
  }

  async function unblock(person: BlockedUser) {
    try {
      await unblockUser(person.blocked_id);
      setBlocked((list) => list.filter((b) => b.blocked_id !== person.blocked_id));
    } catch (e) {
      Alert.alert('Could not unblock', errorMessage(e));
    }
  }

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={32}
    >
      <View style={styles.me}>
        <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile picture">
          <Avatar name={profile?.full_name} url={profile?.avatar_url} size={84} style={styles.photo} />
          <View style={styles.camera}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="camera" size={16} color="#fff" />}
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name || 'Your profile'}</Text>
          <Text style={shared.muted}>{profile?.campus || 'Campus not set'}</Text>
          <View style={[styles.verify, profile?.is_verified && styles.verified]}>
            <MaterialCommunityIcons name={profile?.is_verified ? 'check-decagram' : 'shield-outline'} size={15} color={colors.ink} />
            <Text style={styles.verifyText}>{profile?.is_verified ? 'Verified student' : 'Not verified yet'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stats}>
        <StatTile icon="star" bg={colors.tags[0]} label="Rating" value={stats.rating ? stats.rating.toFixed(1) : 'New'} />
        <StatTile icon="package-variant-closed" bg={colors.tags[2]} label="Items listed" value={String(listings.length)} />
        <StatTile icon="recycle-variant" bg={colors.tags[1]} label="Lendr points" value={String(stats.points)} />
        <StatTile icon="cash" bg={colors.tags[3]} label="Earned" value={money(stats.earnedCents)} />
      </View>
      <Text style={styles.note}>You earn a Lendr point every time someone rents one of your items.</Text>

      <SectionBanner icon="view-grid-outline" title="Your listings" count={listings.length} slim />
      {listings.length === 0 ? (
        <Empty message="You have not listed anything yet." action={<Button label="List an item" variant="ghost" onPress={() => router.push('/create')} />} />
      ) : (
        <View style={styles.grid}>
          {listings.map((l) => (
            <View key={l.id} style={styles.cell}>
              <ListingCard listing={l} onPress={() => router.push(`/listing/${l.id}`)} />
            </View>
          ))}
        </View>
      )}

      <SectionBanner icon="account-edit-outline" title="Account" slim />
      <View style={shared.box}>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <View style={{ marginTop: 14 }}>
          <Text style={styles.fieldLabel}>Campus</Text>
          <Text style={shared.muted}>
            {profile?.campus ? `${profile.campus}. Set automatically from your school email.` : 'Sign up with a supported school email to join a campus.'}
          </Text>
        </View>
        <Button label="Save" onPress={saveName} busy={saving} />
      </View>

      <SectionBanner icon="account-cancel-outline" title="Blocked users" count={blocked.length} slim />
      {blocked.length === 0 ? (
        <Text style={[shared.muted, styles.note]}>You have not blocked anyone. You can block someone from their listing or Wanted post.</Text>
      ) : (
        <View style={shared.box}>
          {blocked.map((b, i) => (
            <View key={b.blocked_id} style={[shared.row, i > 0 && styles.blockedDivider]}>
              <View style={styles.blockedWho}>
                <Avatar name={b.profiles?.full_name} url={b.profiles?.avatar_url} size={36} />
                <Text style={styles.blockedName} numberOfLines={1}>{b.profiles?.full_name || 'A student'}</Text>
              </View>
              <Button small variant="ghost" label="Unblock" onPress={() => unblock(b)} />
            </View>
          ))}
        </View>
      )}

      <Button label="Log out" variant="ghost" onPress={signOut} style={{ marginTop: 8 }} />
      <Button label="Delete account" variant="danger" onPress={confirmDeleteAccount} busy={deleting} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  photo: { borderWidth: 3, borderColor: colors.mint },
  camera: {
    position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.paper, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink },
  verify: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  verified: { backgroundColor: colors.tags[0], borderColor: colors.tags[0] },
  verifyText: { fontWeight: '700', fontSize: 13, color: colors.ink },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0, padding: 12 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: colors.muted, fontSize: 13 },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 13, marginTop: 8, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  cell: { width: '47%' },
  blockedWho: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  blockedName: { fontSize: 16, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  blockedDivider: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 10 },
  fieldLabel: { fontWeight: '700', fontSize: 14, color: colors.ink, marginBottom: 4 },
});
