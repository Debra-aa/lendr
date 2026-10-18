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

/** Turns a storage path saved in listing_images into a URL an <Image> can show. */
export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Reads a picked photo from the phone and uploads it to Storage. */
export async function uploadImage(bucket: string, path: string, uri: string, contentType: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}
