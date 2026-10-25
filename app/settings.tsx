// Account settings, pushed on top of the tabs from the Profile gear or the top bar menu.
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth, useUserId } from '../lib/auth';
import { SUPPORT_EMAIL } from '../lib/config';
import { confirmAction, notify } from '../lib/confirm';
import { CONTACT_INFO } from '../lib/contacts';
import { errorMessage } from '../lib/moderation';
import { AVATAR_BUCKET, PHOTO_BUCKET, removeFolder, supabase } from '../lib/supabase';
import { CONTACT_TYPES, CONTACT_VALUE_MAX, type ContactType, type ProfileContact } from '../types/database';
import { SETTINGS_BG, SettingsBlock, SettingsRow, SettingsSection } from '../components/SettingsList';
import { Button, Chip, Field } from '../components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const userId = useUserId();
  const { profile, session, refreshProfile } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [savedContact, setSavedContact] = useState<ProfileContact | null>(null);
  const [contactType, setContactType] = useState<ContactType>('phone');
  const [contactValue, setContactValue] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function showContact(c: ProfileContact | null) {
    setSavedContact(c);
    setContactType(c?.contact_type ?? 'phone');
    setContactValue(c?.contact_value ?? '');
  }

  // Refresh on focus so the blocked count updates after visiting Blocked users.
  useFocusEffect(useCallback(() => {
    supabase.from('profile_contacts').select('user_id, contact_type, contact_value').eq('user_id', userId).maybeSingle()
      .then(({ data, error }) => { if (!error) showContact(data as ProfileContact | null); });
    supabase.from('blocks').select('blocked_id', { count: 'exact', head: true }).eq('blocker_id', userId)
      .then(({ count }) => setBlockedCount(count ?? 0));
  }, [userId]));

  function startEditingName() {
    setFullName(profile?.full_name ?? '');
    setEditingName(true);
  }

  async function saveName() {
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() || null }).eq('id', userId);
    setSavingName(false);
    if (error) return notify('Name not saved', error.message);
    await refreshProfile();
    setEditingName(false);
  }

  async function saveContact() {
    const value = contactValue.trim();
    if (!value) return notify('Add your contact', `Enter your ${CONTACT_INFO[contactType].label.toLowerCase()} so renters can reach you.`);
    setSavingContact(true);
    const { data, error } = await supabase
      .from('profile_contacts')
      .upsert({ user_id: userId, contact_type: contactType, contact_value: value }, { onConflict: 'user_id' })
      .select('user_id, contact_type, contact_value')
      .single();
    setSavingContact(false);
    if (error) return notify('Contact not saved', error.message);
    showContact(data as ProfileContact);
    notify('Contact saved');
  }

  async function removeContact() {
    if (!(await confirmAction('Remove your contact?', 'People you rent with will not see a way to reach you.', 'Remove'))) return;
    const { error } = await supabase.from('profile_contacts').delete().eq('user_id', userId);
    if (error) notify('Could not remove', error.message);
    else showContact(null);
  }

  function contactSupport() {
    if (!SUPPORT_EMAIL) return notify('Contact support', 'Support email is not set up yet.');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Lendr support')}`)
      .catch(() => notify('Contact support', `Email us at ${SUPPORT_EMAIL}.`));
  }

  async function logOut() {
    if (await confirmAction('Log out of Lendr?', '', 'Log out')) supabase.auth.signOut();
  }

  async function deleteAccount() {
    const confirmed = await confirmAction(
      'Delete your account?',
      'This permanently deletes your profile, listings, photos, rentals and wanted posts. It cannot be undone.',
      'Delete',
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      // Files first: Storage can't be cleaned up from inside the database, and once the
      // account is gone nobody can delete them. Everything lives under <user id>/.
      // If this fails we stop here, so nothing is left behind; trying again is safe.
      await removeFolder(AVATAR_BUCKET, userId);
      await removeFolder(PHOTO_BUCKET, userId);

      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      // The login no longer exists, so just clear it from this device.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      setDeleting(false);
      // Shows the database's message, e.g. when a rental is still in progress.
      notify('Account not deleted', errorMessage(e));
    }
  }

  const version = Constants.expoConfig?.version ?? '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SettingsSection title="Account">
        {editingName ? (
          <SettingsBlock>
            <Field label="Name" value={fullName} onChangeText={setFullName} autoComplete="name" autoFocus />
            <View style={styles.buttons}>
              <Button small variant="ghost" label="Cancel" onPress={() => setEditingName(false)} />
              <Button small label="Save" onPress={saveName} busy={savingName} />
            </View>
          </SettingsBlock>
        ) : (
          <SettingsRow icon="account-outline" label="Name" value={profile?.full_name || 'Add your name'} onPress={startEditingName} />
        )}
        <SettingsRow icon="email-outline" label="School email" value={session?.user.email ?? ''} />
        <SettingsRow icon="school-outline" label="Campus" value={profile?.campus || 'Not set'} subtitle="Set from your school email" />
      </SettingsSection>

      <SettingsSection title="Contact for pickups" footer="Only shown to someone after you approve their rental.">
        <SettingsBlock>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CONTACT_TYPES.map((t) => (
              <Chip key={t} label={CONTACT_INFO[t].label} selected={contactType === t} onPress={() => setContactType(t)} />
            ))}
          </ScrollView>
          <Field
            label={CONTACT_INFO[contactType].label}
            value={contactValue}
            onChangeText={setContactValue}
            placeholder={CONTACT_INFO[contactType].placeholder}
            keyboardType={CONTACT_INFO[contactType].keyboard}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={CONTACT_VALUE_MAX}
          />
          <View style={styles.buttons}>
            {savedContact ? <Button small variant="ghost" label="Remove" onPress={removeContact} /> : null}
            <Button small label="Save" onPress={saveContact} busy={savingContact} />
          </View>
        </SettingsBlock>
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsRow icon="theme-light-dark" label="Color mode" value="Dark" subtitle="Light mode coming soon" />
      </SettingsSection>

      <SettingsSection title="Privacy & safety">
        <SettingsRow
          icon="account-cancel-outline"
          label="Blocked users"
          value={blockedCount === null ? undefined : String(blockedCount)}
          onPress={() => router.push('/blocked-users')}
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow icon="file-document-outline" label="Terms of Use" onPress={() => router.push('/terms')} />
        <SettingsRow icon="shield-lock-outline" label="Privacy policy" onPress={() => router.push('/privacy')} />
        <SettingsRow icon="lifebuoy" label="Contact support" onPress={contactSupport} />
        <SettingsRow icon="information-outline" label="Version" value={version} />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow icon="logout" label="Log out" onPress={logOut} chevron={false} />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow icon="delete-outline" label="Delete account" onPress={deleteAccount} chevron={false} danger busy={deleting} />
      </SettingsSection>
      <Text style={styles.fine}>Deleting your account can't be undone.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SETTINGS_BG },
  content: { padding: 16, paddingBottom: 48 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  fine: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginTop: -18 },
});
