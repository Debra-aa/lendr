// Small "Pickup photo" / "Return photo" thumbnails on a rental. Tap to see full size.
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';
import type { BookingPhoto, HandoffKind } from '../types/database';

const LABELS: Record<HandoffKind, string> = { pickup: 'Pickup photo', return: 'Return photo' };

type Props = { photos: BookingPhoto[]; urls: Record<string, string> };

export function HandoffPhotos({ photos, urls }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  // The newest photo of each kind, if its signed URL loaded.
  const shown = (['pickup', 'return'] as const)
    .map((kind) => {
      const latest = photos.filter((p) => p.kind === kind).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return latest && urls[latest.storage_path] ? { kind, url: urls[latest.storage_path] } : null;
    })
    .filter((p): p is { kind: HandoffKind; url: string } => p !== null);

  if (shown.length === 0) return null;

  return (
    <View style={styles.row}>
      {shown.map((p) => (
        <Pressable key={p.kind} onPress={() => setOpen(p.url)} accessibilityRole="imagebutton" accessibilityLabel={`Open ${LABELS[p.kind]}`}>
          <Image source={{ uri: p.url }} style={styles.thumb} />
          <Text style={styles.label}>{LABELS[p.kind]}</Text>
        </Pressable>
      ))}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(null)} accessibilityLabel="Close photo">
          {open ? <Image source={{ uri: open }} style={styles.full} resizeMode="contain" /> : null}
          <Text style={styles.hint}>Tap to close</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  label: { fontSize: 11, color: colors.muted, marginTop: 3, textAlign: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
  hint: { color: '#fff', marginTop: 12, fontSize: 14 },
});
