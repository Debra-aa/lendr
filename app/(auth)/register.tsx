import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { Button, Field } from '../../components/ui';
import { AuthScreen, authText } from '../../components/AuthScreen';
import { PasswordField } from '../../components/PasswordField';
import { notify } from '../../lib/confirm';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      notify('Missing info', 'Add your name, email, and a password of at least 6 characters.');
      return;
    }
    if (!agreed) {
      notify('Terms of Use', 'Please agree to the Terms of Use to create an account.');
      return;
    }
    setLoading(true);
    // full_name is saved on the account; the database copies it into profiles
    // and fills in the campus from the email domain.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (error) {
      notify('Could not create account', error.message);
    } else if (!data.session) {
      // Email confirmation is on, so there is no session until they tap the link.
      notify('Check your email', 'Tap the link we sent you to confirm your account, then log in.');
      router.replace('/(auth)/login');
    }
    // If a session came back, the root layout opens the app automatically.
  }

  return (
    <AuthScreen mode="signup" title="Create your account" sub="Borrow what you need. Lend what you are not using.">
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field label="School email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@calvin.edu" />
      <PasswordField value={password} onChangeText={setPassword} autoComplete="new-password" placeholder="At least 6 characters" />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed(!agreed)}
        style={styles.agree}
      >
        <MaterialCommunityIcons
          name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={agreed ? colors.mint : colors.muted}
        />
        <Text style={styles.agreeText}>
          I agree to the{' '}
          <Text style={authText.link} onPress={() => router.push('/terms')} accessibilityRole="link">Terms of Use</Text>
        </Text>
      </Pressable>

      <Button label="Create account" onPress={handleRegister} busy={loading} />

      <Text style={authText.fine}>
        Use your .edu email so other students know you are on campus. Your school is added automatically.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  agree: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  agreeText: { flex: 1, fontSize: 15, color: colors.ink },
});
