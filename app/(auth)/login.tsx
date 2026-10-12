import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Field } from '../../components/ui';
import { authStyles as styles } from '../../components/authStyles';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    // On success the root layout sees the new session and opens the app automatically.
    if (error) Alert.alert('Could not log in', error.message);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoRow}>
        <View style={styles.logo}><View style={styles.logoHole} /></View>
        <Text style={styles.wordmark}>lendr</Text>
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to borrow and lend on campus.</Text>

      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@calvin.edu" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />

      <Button label="Log in" onPress={handleLogin} busy={loading} />

      <Pressable onPress={() => router.push('/(auth)/register')} style={styles.linkWrap}>
        <Text style={styles.link}>New to Lendr? Create an account</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
