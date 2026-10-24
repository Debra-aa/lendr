// Blocked users, opened from Settings > Privacy & safety. Unblocking takes effect right away.
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useUserId } from '../lib/auth';
import { notify } from '../lib/confirm';
import { errorMessage, unblockUser } from '../lib/moderation';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { Avatar } from '../components/Avatar';
import { SETTINGS_BG, SettingsSection } from '../components/SettingsList';
import { Button } from '../components/ui';

type BlockedUser = { blocked_id: string; profiles: { full_name: string | null; avatar_url: string | null } | null };

export default function BlockedUsersScreen() {
  const userId = useUserId();
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);

  useFocusEffect(useCallback(() => {
    // blocks links to profiles twice, so name the foreign key.
    supabase.from('blocks').select('blocked_id, profiles!blocks_blocked_id_fkey(full_name, avatar_url)')
      .eq('blocker_id', userId).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) notify('Could not load blocked users', error.message);
        setBlocked((data ?? []) as unknown as BlockedUser[]);
      });
  }, [userId]));

  async function unblock(person: BlockedUser) {
    try {
      await unblockUser(person.blocked_id);
      setBlocked((list) => (list ?? []).filter((b) => b.blocked_id !== person.blocked_id));
    } catch (e) {
      notify('Could not unblock', errorMessage(e));
    }
  }

  if (blocked === null) {
    return <View style={[styles.screen, styles.center]}><ActivityIndicator color={colors.mint} /></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {blocked.length === 0 ? (
        <Text style={styles.empty}>You have not blocked anyone. You can block someone from their listing or Wanted post.</Text>
      ) : (
        <SettingsSection footer="Blocked users can't see your listings or Wanted posts, and you won't see theirs.">
          {blocked.map((b) => (
            <View key={b.blocked_id} style={styles.row}>
              <Avatar name={b.profiles?.full_name} url={b.profiles?.avatar_url} size={36} />
              <Text style={styles.name} numberOfLines={1}>{b.profiles?.full_name || 'A student'}</Text>
              <Button small variant="ghost" label="Unblock" onPress={() => unblock(b)} />
            </View>
          ))}
        </SettingsSection>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SETTINGS_BG },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  name: { flex: 1, fontSize: 16, color: colors.ink },
  empty: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginTop: 32, marginHorizontal: 16, lineHeight: 21 },
});
