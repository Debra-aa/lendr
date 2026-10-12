import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { firstName, money, toCents } from '../../lib/format';
import { colors } from '../../lib/theme';
import type { WantedRequest } from '../../types/database';
import { Button, Empty, Field, Title, shared } from '../../components/ui';

export default function WantedScreen() {
  const router = useRouter();
  const userId = useUserId();
  const [posts, setPosts] = useState<WantedRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [offer, setOffer] = useState('');
  const [posting, setPosting] = useState(false);

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('wanted_requests')
      .select('*, profiles(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Could not load the Wanted board', error.message);
    else setPosts(data as WantedRequest[]);
  }, []);

  useFocusEffect(useCallback(() => { loadPosts(); }, [loadPosts]));

  async function refresh() {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }

  async function post() {
    const offerCents = offer.trim() === '' ? null : toCents(offer);
    if (!title.trim()) return Alert.alert('Missing info', 'Add what you need before posting.');
    if (offer.trim() !== '' && offerCents === null) return Alert.alert('Check the offer', 'Enter a dollar amount or leave it empty.');

    setPosting(true);
    const { error } = await supabase.from('wanted_requests').insert({
      requester_id: userId,
      title: title.trim(),
      details: details.trim() || null,
      offer_cents_per_day: offerCents,
    });
    setPosting(false);
    if (error) return Alert.alert('Request not posted', error.message);
    setTitle(''); setDetails(''); setOffer('');
    loadPosts();
  }

  async function markFound(id: string) {
    const { error } = await supabase.from('wanted_requests').update({ status: 'fulfilled' }).eq('id', id);
    if (error) Alert.alert('Could not update', error.message);
    else loadPosts();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={shared.screen}
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Title sub="Students asking for things nobody has listed yet. If you have it, list it.">Wanted</Title>

        {posts.length === 0 ? <Empty message="No requests right now. Be the first to ask for something." /> : null}

        {posts.map((p) => {
          const mine = p.requester_id === userId;
          return (
            <View key={p.id} style={shared.box}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={shared.muted}>
                {mine ? 'Your request' : `${firstName(p.profiles?.full_name)} is asking`}
                {p.details ? `. ${p.details}` : ''}
              </Text>
              <View style={[shared.row, { marginTop: 10 }]}>
                {p.offer_cents_per_day !== null ? (
                  <Text style={styles.offer}>Offering {money(p.offer_cents_per_day)}/day</Text>
                ) : <View />}
                {mine ? (
                  <Button small variant="ghost" label="Mark as found" onPress={() => markFound(p.id)} />
                ) : (
                  <Button small label="I have one" onPress={() => router.push({ pathname: '/create', params: { title: p.title } })} />
                )}
              </View>
            </View>
          );
        })}

        <Text style={styles.formTitle}>Ask for something</Text>
        <View style={shared.box}>
          <Field label="What do you need?" value={title} onChangeText={setTitle} placeholder="A sleeping bag for fall retreat" />
          <Field label="When, and any details" value={details} onChangeText={setDetails} placeholder="This weekend, size M" />
          <Field label="Offer per day ($, optional)" value={offer} onChangeText={setOffer} keyboardType="decimal-pad" placeholder="3" />
          <Button label="Post request" onPress={post} busy={posting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  postTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  offer: { backgroundColor: colors.tags[0], color: colors.ink, fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  formTitle: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 18, marginBottom: 10 },
});
