// iOS-style grouped settings: white rounded section cards on a light gray screen,
// rows with an icon, a label, and a value or chevron, separated by thin dividers.
import { Children, Fragment, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, type IconName } from '../lib/theme';

export const SETTINGS_BG = '#F2F2F7';
const DIVIDER = '#E5E5EA';
const SECONDARY = '#8E8E93';

type SectionProps = { title?: string; footer?: string; children: ReactNode };

export function SettingsSection({ title, footer, children }: SectionProps) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  chevron?: boolean; // defaults to true when the row is tappable
  danger?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({ icon, label, value, subtitle, onPress, chevron, danger, busy, accessibilityLabel }: RowProps) {
  const showChevron = chevron ?? !!onPress;
  const tint = danger ? colors.mint : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || busy}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? [label, value].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && onPress ? { backgroundColor: '#E9E9EE' } : null]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={danger ? colors.mint : SECONDARY} style={styles.icon} />
      <View style={styles.text}>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
      {busy ? <ActivityIndicator color={SECONDARY} /> : null}
      {showChevron && !busy ? <MaterialCommunityIcons name="chevron-right" size={22} color="#C7C7CC" /> : null}
    </Pressable>
  );
}

/** Free-form content inside a section card, e.g. an inline form. */
export function SettingsBlock({ children }: { children: ReactNode }) {
  return <View style={styles.block}>{children}</View>;
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, color: SECONDARY, marginLeft: 16, marginBottom: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginLeft: 50 },
  footer: { fontSize: 13, color: SECONDARY, marginHorizontal: 16, marginTop: 6, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: 10, paddingHorizontal: 14, gap: 12 },
  icon: { width: 24, textAlign: 'center' },
  text: { flex: 1 },
  label: { fontSize: 16 },
  subtitle: { fontSize: 13, color: SECONDARY, marginTop: 2 },
  value: { fontSize: 16, color: SECONDARY, maxWidth: '55%', textAlign: 'right' },
  block: { padding: 14 },
});
