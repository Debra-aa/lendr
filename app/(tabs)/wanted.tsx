import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { firstName, money, toCents } from '../../lib/format';
import { colors, radius } from '../../lib/theme';
import { confirmBlock } from '../../lib/moderation';
import type { ReportTarget, WantedRequest } from '../../types/database';
import { useShrinkingBanner } from '../../components/Banner';
import { ReportSheet } from '../../components/ReportSheet';
import { SectionBanner } from '../../components/SectionBanner';
import { Button, Empty, Field, shared } from '../../components/ui';

export default function WantedScreen() {
  const router = useRouter();
  const userId = useUserId();
  const onScroll = useShrinkingBanner();
  const [posts, setPosts] = useState<WantedRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [offer, setOffer] = useState('');
  const [posting, setPosting] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

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
        onScroll={onScroll}
        scrollEventThrottle={32}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mint} />}
      >
        <SectionBanner
          icon="message-alert-outline"
          title="Wanted"
          sub="Students asking for things nobody has listed yet. If you have it, list it."
        />

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
                  <View style={styles.offer}><Text style={styles.offerText}>Offering {money(p.offer_cents_per_day)}/day</Text></View>
                ) : <View />}
                {mine ? (
                  <Button small variant="ghost" label="Mark as found" onPress={() => markFound(p.id)} />
                ) : (
                  <Button small label="I have one" onPress={() => router.push({ pathname: '/create', params: { title: p.title } })} />
                )}
              </View>
              {!mine ? (
                <View style={styles.safety}>
                  <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    onPress={() => setReportTarget({ wanted_request_id: p.id, reported_user_id: p.requester_id })}
                  >
                    <Text style={styles.safetyText}>Report</Text>
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    onPress={() => confirmBlock(p.requester_id, firstName(p.profiles?.full_name), loadPosts)}
                  >
                    <Text style={styles.safetyText}>Block user</Text>
                  </Pressable>
                </View>
              ) : null}
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
      <ReportSheet target={reportTarget} title="Report Wanted post" onClose={() => setReportTarget(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  postTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  offer: { backgroundColor: colors.pink, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  offerText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  safety: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 10 },
  safetyText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  formTitle: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 18, marginBottom: 10 },
});
