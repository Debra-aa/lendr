import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { LISTING_SELECT } from '../../lib/queries';
import { colors } from '../../lib/theme';
import type { Listing, Profile } from '../../types/database';
import { ListingCard } from '../../components/ListingCard';
import { Button, Empty, Field, Title, shared } from '../../components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useUserId();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [campus, setCampus] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [profileResult, listingsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('listings').select(LISTING_SELECT).eq('owner_id', userId).order('created_at', { ascending: false }),
    ]);
    if (profileResult.data) {
      const p = profileResult.data as Profile;
      setProfile(p);
      setFullName(p.full_name ?? '');
      setCampus(p.campus ?? '');
    }
    if (listingsResult.data) setListings(listingsResult.data as Listing[]);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, campus: campus.trim() || null })
      .eq('id', userId);
    setSaving(false);
    if (error) Alert.alert('Profile not saved', error.message);
    else Alert.alert('Profile saved');
  }

  function signOut() {
    Alert.alert('Log out of Lendr?', '', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
      <Title>{profile?.full_name || 'Your profile'}</Title>

      <View style={[styles.verify, profile?.is_verified && styles.verified]}>
        <MaterialCommunityIcons name={profile?.is_verified ? 'check-decagram' : 'shield-outline'} size={18} color={colors.ink} />
        <Text style={styles.verifyText}>{profile?.is_verified ? 'Verified student' : 'Not verified yet'}</Text>
      </View>

      <View style={shared.box}>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field label="Campus" value={campus} onChangeText={setCampus} placeholder="Calvin University" />
        <Button label="Save profile" onPress={save} busy={saving} />
      </View>

      <Text style={styles.section}>Your listings</Text>
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

      <Button label="Log out" variant="ghost" onPress={signOut} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  verify: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  verified: { backgroundColor: colors.tags[1] },
  verifyText: { fontWeight: '700', color: colors.ink },
  section: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 10, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '47%' },
});
