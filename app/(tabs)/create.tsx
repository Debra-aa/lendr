import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PHOTO_BUCKET, supabase, uploadImage } from '../../lib/supabase';
import { useUserId } from '../../lib/auth';
import { toCents } from '../../lib/format';
import { colors, radius } from '../../lib/theme';
import { CATEGORIES, CATEGORY_DETAIL_MAX, CONDITIONS, CONDITION_LABELS, OTHER_CATEGORY, type Condition } from '../../types/database';
import { TopBar } from '../../components/TopBar';
import { Button, Chip, Field, Title, shared } from '../../components/ui';
import { notify } from '../../lib/confirm';

const MAX_PHOTOS = 4;

export default function CreateListingScreen() {
  const router = useRouter();
  const userId = useUserId();
  // The Wanted board can open this screen with a title filled in.
  const params = useLocalSearchParams<{ title?: string }>();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [categoryDetail, setCategoryDetail] = useState(''); // only used for Other
  const [condition, setCondition] = useState<Condition | null>(null); // required, no default
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [pickup, setPickup] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.title) setTitle(params.title);
  }, [params.title]);

  async function pickPhotos() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
        quality: 0.7,
        // Ask iOS for a standard JPEG copy. Fixes web/PNG images and iCloud-only photos.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (!result.canceled) setPhotos([...photos, ...result.assets].slice(0, MAX_PHOTOS));
    } catch {
      notify('Photo not added', 'That photo could not be opened. Try a different photo, or one taken with your camera.');
    }
  }

  function chooseCategory(next: string) {
    setCategory(next);
    if (next !== OTHER_CATEGORY) setCategoryDetail('');
  }

  function resetForm() {
    setTitle(''); setPrice(''); setDeposit(''); setPickup(''); setDescription(''); setPhotos([]);
    chooseCategory(CATEGORIES[0]);
    setCondition(null);
  }

  async function publish() {
    const priceCents = toCents(price);
    const depositCents = deposit.trim() === '' ? 0 : toCents(deposit);
    const isOther = category === OTHER_CATEGORY;
    if (!title.trim()) return notify('Missing info', 'Give your item a name so people can find it.');
    if (isOther && !categoryDetail.trim()) {
      return notify('What kind of item is it?', 'You picked Other, so add a word or two like "Costume" or "Kitchen" so people can find it.');
    }
    if (!condition) return notify('Pick a condition', 'Let renters know what shape the item is in, from New to Well used.');
    if (priceCents === null || priceCents < 100) return notify('Check the price', 'Set a price of at least $1 a day.');
    if (depositCents === null) return notify('Check the deposit', 'Enter a dollar amount, or leave it empty for no deposit.');

    setSaving(true);
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        owner_id: userId,
        title: title.trim(),
        category,
        category_detail: isOther ? categoryDetail.trim() : null,
        condition,
        price_cents_per_day: priceCents,
        deposit_cents: depositCents,
        pickup_location: pickup.trim() || null,
        description: description.trim() || null,
      })
      .select('id')
      .single();

    if (error || !listing) {
      setSaving(false);
      return notify('Listing not published', error?.message ?? 'Please try again.');
    }

    // Upload photos one by one; the listing still exists if a photo fails.
    let failed = 0;
    for (const [index, asset] of photos.entries()) {
      try {
        const type = asset.mimeType ?? 'image/jpeg';
        const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
        // The first folder must be the user's id; the storage policy checks this.
        const path = `${userId}/${listing.id}/${Date.now()}-${index}.${extension}`;
        await uploadImage(PHOTO_BUCKET, path, asset.uri, type);
        const { error: rowError } = await supabase
          .from('listing_images')
          .insert({ listing_id: listing.id, storage_path: path, position: index });
        if (rowError) throw rowError;
      } catch {
        failed += 1;
      }
    }

    setSaving(false);
    resetForm();
    if (failed > 0) notify('Listing published', `${failed} photo(s) did not upload. You can try again later.`);
    router.push(`/listing/${listing.id}`);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar />
      <ScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
        <Title sub="Earn a little from things you are not using this week.">List an item</Title>

        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={p.uri}>
              <Image source={{ uri: p.uri }} style={styles.thumb} />
              <Pressable accessibilityLabel="Remove photo" style={styles.remove} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable style={[styles.thumb, styles.addPhoto]} onPress={pickPhotos} accessibilityLabel="Add photos">
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.mint} />
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          )}
        </View>

        <Field label="Item name" value={title} onChangeText={setTitle} placeholder="Camping stove" />

        <Text style={[styles.label, { marginTop: 14 }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => chooseCategory(c)} />)}
        </ScrollView>
        {category === OTHER_CATEGORY ? (
          <Field
            label="What kind of item is it?"
            value={categoryDetail}
            onChangeText={setCategoryDetail}
            placeholder="Costume, kitchen, sewing…"
            maxLength={CATEGORY_DETAIL_MAX}
            autoCapitalize="sentences"
          />
        ) : null}

        <Text style={[styles.label, { marginTop: 14 }]}>Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CONDITIONS.map((c) => (
            <Chip key={c} label={CONDITION_LABELS[c]} selected={condition === c} onPress={() => setCondition(c)} />
          ))}
        </ScrollView>

        <View style={styles.pair}>
          <View style={{ flex: 1 }}><Field label="Price per day ($)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="3" /></View>
          <View style={{ flex: 1 }}><Field label="Deposit ($)" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" placeholder="15" /></View>
        </View>

        <Field label="Pickup spot" value={pickup} onChangeText={setPickup} placeholder="Knollcrest East lobby" />
        <Field label="Description" value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="What is included and what condition it is in" />

        <Button label="Publish listing" onPress={publish} busy={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', fontSize: 14, color: colors.ink, marginBottom: 6 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { width: 74, height: 74, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.rim },
  addPhoto: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.mint },
  addText: { fontSize: 12, fontWeight: '700', color: colors.mint },
  remove: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  pair: { flexDirection: 'row', gap: 12 },
});
