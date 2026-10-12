import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Field } from '../../components/ui';
import { authStyles as styles } from '../../components/authStyles';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Missing info', 'Add your name, email, and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    // full_name is saved on the account; the database trigger copies it into profiles.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Could not create account', error.message);
    } else if (!data.session) {
      // Email confirmation is on in Supabase, so there is no session until they confirm.
      Alert.alert('Check your email', 'Tap the link we sent you, then log in.');
      router.replace('/(auth)/login');
    }
    // If a session came back, the root layout opens the app automatically.
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.screen, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logo}><View style={styles.logoHole} /></View>
          <Text style={styles.wordmark}>lendr</Text>
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Your campus is your supply closet.</Text>

        <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@calvin.edu" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 6 characters" />

        <Button label="Create account" onPress={handleRegister} busy={loading} />

        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkWrap}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
