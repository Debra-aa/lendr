import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

// Decides which screens exist based on whether someone is signed in.
// Stack.Protected handles the redirects: signed-out users only see (auth),
// signed-in users only see the app.
function RootNavigator() {
  const { session, loading } = useAuth();
  if (loading) return null; // still reading the saved session from the phone

  const signedIn = session !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Back',
            headerTintColor: colors.ink,
            headerStyle: { backgroundColor: colors.paper },
            headerShadowVisible: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Open to everyone: Sign up links here before there is an account. */}
      <Stack.Screen
        name="terms"
        options={{
          headerShown: true,
          title: 'Terms of Use',
          headerBackTitle: 'Back',
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
