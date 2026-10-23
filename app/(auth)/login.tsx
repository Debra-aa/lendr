import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Field } from '../../components/ui';
import { AuthScreen, authText } from '../../components/AuthScreen';
import { PasswordField } from '../../components/PasswordField';
import { notify } from '../../lib/confirm';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      notify('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    // On success the root layout sees the new session and opens the app automatically.
    if (error) notify('Could not log in', error.message);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      notify('Enter your email first', 'Type your school email above, then tap Forgot password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) notify('Could not send reset email', error.message);
    else notify('Check your email', 'We sent you a link to reset your password.');
  }

  return (
    <AuthScreen mode="login" title="Welcome back" sub="Log in to borrow and lend on campus.">
      <Field label="School email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@calvin.edu" />
      <PasswordField value={password} onChangeText={setPassword} autoComplete="password" placeholder="Your password" />

      <Pressable onPress={forgotPassword} style={{ alignSelf: 'flex-end', paddingVertical: 8 }} accessibilityRole="button">
        <Text style={authText.link}>Forgot password?</Text>
      </Pressable>

      <Button label="Log in" onPress={handleLogin} busy={loading} style={{ marginTop: 4 }} />

      <Text style={authText.fine}>
        New to Lendr?{' '}
        <Text style={authText.link} onPress={() => router.replace('/(auth)/register')}>Create an account</Text>
      </Text>
    </AuthScreen>
  );
}
