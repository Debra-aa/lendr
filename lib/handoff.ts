// Handoff photos: the lender photographs the item at pickup and at return.
// The database won't let a booking move to active/completed without one.
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { HANDOFF_BUCKET, supabase, uploadImage } from './supabase';
import type { HandoffKind } from '../types/database';
import { notify } from './confirm';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7, // keeps photos well under the bucket's 5 MB limit
  // Ask iOS for a standard JPEG copy. Fixes HEIC and iCloud-only photos.
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

/**
 * Asks Take photo / Choose from library. Resolves to null if they cancel.
 * On web there's no camera (and Alert buttons don't show), so go straight to the library.
 */
export function chooseSource(title: string): Promise<'camera' | 'library' | null> {
  if (Platform.OS === 'web') return Promise.resolve('library');
  return new Promise((resolve) => {
    Alert.alert(title, 'Take a photo of the item so you both have a record of its condition.', [
      { text: 'Take photo', onPress: () => resolve('camera') },
      { text: 'Choose from library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
}

/** Opens the camera or library. Returns null if cancelled or the photo couldn't be opened. */
export async function pickHandoffPhoto(source: 'camera' | 'library'): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        notify('Camera not allowed', 'Allow camera access for Lendr in Settings, or choose a photo from your library.');
        return null;
      }
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    return result.canceled ? null : result.assets[0];
  } catch {
    notify('Photo not added', 'That photo could not be opened. Try again, or use a different photo.');
    return null;
  }
}

/** Uploads to <booking_id>/<kind>-<timestamp>.jpg and records it in booking_photos. */
export async function saveHandoffPhoto(bookingId: string, kind: HandoffKind, asset: ImagePicker.ImagePickerAsset) {
  const path = `${bookingId}/${kind}-${Date.now()}.jpg`;
  await uploadImage(HANDOFF_BUCKET, path, asset.uri, asset.mimeType ?? 'image/jpeg');
  const { error } = await supabase.from('booking_photos').insert({ booking_id: bookingId, kind, storage_path: path });
  if (error) throw error;
}

/** Signed URLs (valid for an hour) for photos in the private bucket, keyed by path. */
export async function signedHandoffUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(HANDOFF_BUCKET).createSignedUrls(paths, 60 * 60);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  return urls;
}
