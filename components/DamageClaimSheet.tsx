// Lender's "Report a problem" form for a returned rental: reason, how much of the
// deposit they're keeping, a description, and photos. Files a damage claim, then
// uploads the photos as 'damage' handoff photos.
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notify } from '../lib/confirm';
import { money, toCents } from '../lib/format';
import { chooseSource, pickHandoffPhoto, saveHandoffPhoto } from '../lib/handoff';
import { supabase } from '../lib/supabase';
import { colors, radius } from '../lib/theme';
import { CLAIM_DETAILS_MAX, DAMAGE_REASONS, DAMAGE_REASON_LABELS, type Booking, type DamageReason } from '../types/database';
import { Button, Chip, Field } from './ui';

const MAX_PHOTOS = 6;

type Props = { booking: Booking | null; onClose: () => void; onFiled: () => void };

export function DamageClaimSheet({ booking, onClose, onFiled }: Props) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<DamageReason>('damage');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<ImagePickerAsset[]>([]);
  const [saving, setSaving] = useState(false);

  // Start fresh each time the sheet opens for a rental.
  useEffect(() => {
    if (booking) { setReason('damage'); setAmount(''); setDetails(''); setPhotos([]); }
  }, [booking]);

  if (!booking) return null;
  const deposit = booking.deposit_cents;

  async function addPhoto() {
    const source = await chooseSource('Damage photo');
    if (!source) return;
    const asset = await pickHandoffPhoto(source);
    if (asset) setPhotos((list) => [...list, asset].slice(0, MAX_PHOTOS));
  }

  async function file() {
    if (!booking) return;
    const cents = toCents(amount);
    if (cents === null || cents <= 0) return notify('Check the amount', 'Enter how much of the deposit you are keeping.');
    if (cents > deposit) return notify('Check the amount', `You can keep at most the ${money(deposit)} deposit.`);
    if (!details.trim()) return notify('Describe the problem', 'Say what happened so the renter understands the claim.');
    if (photos.length === 0) return notify('Add a photo', 'Add at least one photo showing the problem.');

    setSaving(true);
    const { error } = await supabase.from('damage_claims').insert({
      booking_id: booking.id,
      reason,
      amount_kept_cents: cents,
      details: details.trim(),
    });
    if (error) {
      setSaving(false);
      return notify('Claim not filed', error.message);
    }

    // The claim stands even if a photo fails; say which ones did not upload.
    let failed = 0;
    for (const asset of photos) {
      try {
        await saveHandoffPhoto(booking.id, 'damage', asset);
      } catch {
        failed += 1;
      }
    }
    setSaving(false);
    onClose();
    onFiled();
    notify(
      'Claim sent',
      failed > 0
        ? `${failed} photo(s) did not upload. The renter has been asked to accept or dispute the claim.`
        : 'The renter has been asked to accept or dispute it.',
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Report a problem</Text>
            <Text style={styles.sub}>{booking.listings?.title}. Only for damage, missing parts or a late return; normal wear isn't damage.</Text>

            <Text style={styles.label}>What happened?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAMAGE_REASONS.map((r) => (
                <Chip key={r} label={DAMAGE_REASON_LABELS[r]} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </ScrollView>

            <Field
              label={`Amount you're keeping from the ${money(deposit)} deposit`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder={(deposit / 100).toFixed(deposit % 100 === 0 ? 0 : 2)}
            />
            <Field
              label="Description"
              value={details}
              onChangeText={setDetails}
              multiline
              textAlignVertical="top"
              maxLength={CLAIM_DETAILS_MAX}
              placeholder="What's damaged or missing, or how late it came back"
            />

            <Text style={[styles.label, { marginTop: 14 }]}>Photos</Text>
            <View style={styles.photoRow}>
              {photos.map((p, i) => (
                <View key={p.uri}>
                  <Image source={{ uri: p.uri }} style={styles.thumb} />
                  <Pressable accessibilityLabel="Remove photo" style={styles.remove} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                    <MaterialCommunityIcons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <Pressable style={[styles.thumb, styles.addPhoto]} onPress={addPhoto} accessibilityRole="button" accessibilityLabel="Add photos">
                  <MaterialCommunityIcons name="camera-plus-outline" size={26} color={colors.mint} />
                  <Text style={styles.addText}>Add photos</Text>
                </Pressable>
              ) : null}
            </View>

            <Button label="Send claim" onPress={file} busy={saving} />
            <Button label="Cancel" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '92%' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  label: { fontWeight: '700', fontSize: 14, color: colors.ink, marginBottom: 6 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { width: 74, height: 74, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.rim },
  addPhoto: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.mint },
  addText: { fontSize: 11, fontWeight: '700', color: colors.mint, marginTop: 2 },
  remove: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center',
  },
});
