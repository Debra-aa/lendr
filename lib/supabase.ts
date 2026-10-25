import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Values come from the .env file (which is kept out of Git).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase settings. Check your .env file and restart Expo.');
}

// One shared client for the whole app. The session is saved on the phone
// so students stay signed in between launches.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh the login token while the app is open, as Supabase recommends for mobile.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const PHOTO_BUCKET = 'listing-photos';
export const AVATAR_BUCKET = 'avatars';
export const HANDOFF_BUCKET = 'handoff-photos'; // private: read with signed URLs

/** Turns a storage path saved in listing_images into a URL an <Image> can show. */
export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes every file under a folder in a bucket, including subfolders
 * (listing photos live at <user id>/<listing id>/<file>). list() only returns one
 * level at a time, and entries without an id are folders.
 */
export async function removeFolder(bucket: string, folder: string) {
  const files: string[] = [];
  const pending = [folder];
  while (pending.length) {
    const prefix = pending.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset });
      if (error) throw error;
      for (const item of data) {
        const path = `${prefix}/${item.name}`;
        if (item.id === null) pending.push(path);
        else files.push(path);
      }
      if (data.length < 1000) break;
    }
  }
  for (let i = 0; i < files.length; i += 1000) {
    const { error } = await supabase.storage.from(bucket).remove(files.slice(i, i + 1000));
    if (error) throw error;
  }
}

/** Reads a picked photo from the phone and uploads it to Storage. */
export async function uploadImage(bucket: string, path: string, uri: string, contentType: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}
