// Small building blocks shared by every screen, so buttons, chips and
// form fields look the same everywhere.
import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type TextInputProps, type ViewStyle,
} from 'react-native';
import { colors } from '../lib/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  small?: boolean;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', small, busy, disabled, style }: ButtonProps) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        (pressed || isDisabled) && { opacity: 0.7 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.ink : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 14 }, variant === 'ghost' && { color: colors.ink }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, input.multiline && { minHeight: 80 }]} {...input} />
    </View>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Empty({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
      {action}
    </View>
  );
}

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 40 },
  box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
  muted: { color: colors.muted },
  error: { color: colors.danger, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
});

const styles = StyleSheet.create({
  button: { backgroundColor: colors.teal, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 14, marginTop: 0 },
  buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  buttonDanger: { backgroundColor: colors.danger },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 14 },
  label: { fontWeight: '700', fontSize: 14, color: colors.ink, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, marginTop: 4, fontSize: 15 },
  empty: { alignItems: 'stretch', paddingVertical: 40 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 15 },
});
