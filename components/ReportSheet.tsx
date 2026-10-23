// Bottom sheet for reporting a listing, Wanted post or review: pick a reason,
// add optional details, send. Open it by passing a target; close by passing null.
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REASON_LABELS, errorMessage, submitReport } from '../lib/moderation';
import { colors, radius } from '../lib/theme';
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '../types/database';
import { Button, Field } from './ui';
import { notify } from '../lib/confirm';

type Props = { target: ReportTarget | null; title?: string; onClose: () => void };

export function ReportSheet({ target, title = 'Report', onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  // Start fresh each time the sheet opens.
  useEffect(() => {
    if (target) { setReason(null); setDetails(''); }
  }, [target]);

  async function send() {
    if (!target || !reason) return;
    setSending(true);
    try {
      await submitReport(target, reason, details);
      onClose();
      notify('Thanks, we’ll review this within 24 hours');
    } catch (e) {
      notify('Report not sent', errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={target !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>Why are you reporting this? Reports are private.</Text>

            {REPORT_REASONS.map((r) => {
              const selected = r === reason;
              return (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setReason(r)}
                  style={[styles.reason, selected && styles.reasonSelected]}
                >
                  <MaterialCommunityIcons
                    name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={22}
                    color={selected ? colors.mint : colors.muted}
                  />
                  <Text style={styles.reasonText}>{REASON_LABELS[r]}</Text>
                </Pressable>
              );
            })}

            <Field label="Details (optional)" value={details} onChangeText={setDetails} multiline placeholder="Anything that helps us understand" />
            <Button label="Send report" variant="danger" onPress={send} busy={sending} disabled={!reason} />
            <Button label="Cancel" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 24, 39, 0.5)' },
  sheet: {
    backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, maxHeight: '90%',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 8,
  },
  reasonSelected: { borderColor: colors.mint },
  reasonText: { fontSize: 16, color: colors.ink },
});
