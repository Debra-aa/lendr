// Small "Pickup photo" / "Return photo" thumbnails on a rental, plus the lender's
// damage photos when includeDamage is set, side by side. Tap to see full size.
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../lib/theme';
import type { BookingPhoto, HandoffKind } from '../types/database';

const LABELS: Record<HandoffKind, string> = { pickup: 'Pickup photo', return: 'Return photo', damage: 'Damage photo' };

type Props = { photos: BookingPhoto[]; urls: Record<string, string>; includeDamage?: boolean };

export function HandoffPhotos({ photos, urls, includeDamage = false }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const newestFirst = [...photos].sort((a, b) => b.created_at.localeCompare(a.created_at));

  // The newest pickup and return photo, then every damage photo (oldest first), if their signed URLs loaded.
  const shown = [
    newestFirst.find((p) => p.kind === 'pickup'),
    newestFirst.find((p) => p.kind === 'return'),
    ...(includeDamage ? newestFirst.filter((p) => p.kind === 'damage').reverse() : []),
  ]
    .filter((p): p is BookingPhoto => !!p && !!urls[p.storage_path])
    .map((p) => ({ key: p.storage_path, kind: p.kind, url: urls[p.storage_path] }));

  if (shown.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroller}>
      {shown.map((p) => (
        <Pressable key={p.key} onPress={() => setOpen(p.url)} accessibilityRole="imagebutton" accessibilityLabel={`Open ${LABELS[p.kind]}`}>
          <Image source={{ uri: p.url }} style={[styles.thumb, p.kind === 'damage' && styles.damageThumb]} />
          <Text style={styles.label}>{LABELS[p.kind]}</Text>
        </Pressable>
      ))}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(null)} accessibilityLabel="Close photo">
          {open ? <Image source={{ uri: open }} style={styles.full} resizeMode="contain" /> : null}
          <Text style={styles.hint}>Tap to close</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { marginTop: 8, flexGrow: 0 },
  row: { flexDirection: 'row', gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  damageThumb: { borderColor: colors.danger },
  label: { fontSize: 11, color: colors.muted, marginTop: 3, textAlign: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
  hint: { color: '#fff', marginTop: 12, fontSize: 14 },
});
