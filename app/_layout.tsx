import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)'

      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login')
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)')
      }
    })
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}