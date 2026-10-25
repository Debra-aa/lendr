import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { AVATAR_BUCKET, supabase, uploadImage } from '../../lib/supabase';
import { useAuth, useUserId } from '../../lib/auth';
import { LISTING_SELECT } from '../../lib/queries';
import { money } from '../../lib/format';
import { colors, radius, type IconName } from '../../lib/theme';
import type { Listing } from '../../types/database';
import { Avatar } from '../../components/Avatar';
import { ListingCard } from '../../components/ListingCard';
import { SectionBanner } from '../../components/SectionBanner';
import { TopBar, useHideOnScroll } from '../../components/TopBar';
import { Button, Empty, shared } from '../../components/ui';
import { notify } from '../../lib/confirm';

type Stats = { rating: number | null; points: number; earnedCents: number };

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

// Account settings (name, contact, blocked users, log out, delete) live on the Settings screen.
export default function ProfileScreen() {
  const router = useRouter();
  const { hidden: barHidden, onScroll } = useHideOnScroll();
  const userId = useUserId();
  const { profile, refreshProfile } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({ rating: null, points: 0, earnedCents: 0 });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [listingsResult, lentResult, reviewsResult] = await Promise.all([
      supabase.from('listings').select(LISTING_SELECT).eq('owner_id', userId).order('created_at', { ascending: false }),
      // Rentals of my items that actually happened (picked up or returned).
      supabase.from('bookings').select('status, total_cents, listings!inner(owner_id)')
        .eq('listings.owner_id', userId).in('status', ['active', 'completed']),
      // Reviews renters left on my items.
      supabase.from('reviews').select('rating, bookings!inner(listings!inner(owner_id))')
        .eq('bookings.listings.owner_id', userId),
    ]);

    if (listingsResult.data) setListings(listingsResult.data as Listing[]);

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

  async function changePhoto() {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
    } catch {
      notify('Photo not added', 'That photo could not be opened. Try a different photo.');
      return;
    }
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
      notify('Photo not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={shared.screen}>
      <TopBar hidden={barHidden} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} style={shared.screen} contentContainerStyle={shared.content}>
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
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.gear}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={6}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.ink} />
          </Pressable>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  photo: { borderWidth: 3, borderColor: colors.mint },
  camera: {
    position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.mint, borderWidth: 2, borderColor: colors.paper, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink },
  verify: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  verified: { backgroundColor: colors.tags[0], borderColor: colors.tags[0] },
  verifyText: { fontWeight: '700', fontSize: 13, color: colors.ink },
  gear: {
    alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 19, backgroundColor: colors.raised,
    alignItems: 'center', justifyContent: 'center',
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0, padding: 12 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: colors.muted, fontSize: 13 },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 13, marginTop: 8, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  cell: { width: '47%' },
});
