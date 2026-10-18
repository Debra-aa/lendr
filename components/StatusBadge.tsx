import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';
import type { BookingStatus } from '../types/database';

// Plain-language labels for each booking status stored in the database.
const LABELS: Record<BookingStatus, string> = {
  requested: 'Waiting for approval',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled',
  active: 'Picked up',
  completed: 'Returned',
};

const BACKGROUNDS: Record<BookingStatus, string> = {
  requested: colors.tags[3],
  approved: colors.tags[0],
  declined: colors.tags[1],
  cancelled: colors.tags[1],
  active: colors.tags[2],
  completed: colors.tags[0],
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: BACKGROUNDS[status] }]}>
      <Text style={styles.text}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, marginTop: 6, borderRadius: radius.pill },
  text: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
