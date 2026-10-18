// Password input with a Show / Hide button.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../lib/theme';

export function PasswordField(props: TextInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>Password</Text>
      <View>
        <TextInput
          {...props}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable onPress={() => setVisible(!visible)} style={styles.toggle} hitSlop={8} accessibilityRole="button">
          <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', fontSize: 14, color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, paddingRight: 64, fontSize: 16, color: colors.ink,
  },
  toggle: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  toggleText: { color: colors.mint, fontWeight: '700' },
});
