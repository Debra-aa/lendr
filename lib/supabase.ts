import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krxhxvuicasqfoykcofx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGh4dnVpY2FzcWZveWtjb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTQwNTgsImV4cCI6MjA5NjA3MDA1OH0.w63YkakCzzyPY5MiL07I9edR4_mEfhHC88O6nYkTiJ0'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})