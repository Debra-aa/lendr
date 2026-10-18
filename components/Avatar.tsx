// A round profile photo, or the person's first initial when there is no photo.
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../lib/theme';

type Props = { name: string | null | undefined; url?: string | null; size?: number; style?: ViewStyle };

export function Avatar({ name, url, size = 40, style }: Props) {
  const initial = (name?.trim()[0] ?? '?').toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.tags[0], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontWeight: '700', color: colors.ink },
});
