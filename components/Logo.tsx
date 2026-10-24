// The Lendr mark: green reuse arrows on a rounded badge (white by default).
// Always colors.logo, even though the rest of the app's accents are red.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors } from '../lib/theme';

type Props = { size?: number; background?: string; radius?: number };

export function Logo({ size = 32, background = '#fff', radius }: Props) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: radius ?? size * 0.28, backgroundColor: background,
        alignItems: 'center', justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons name="recycle-variant" size={size * 0.72} color={colors.logo} />
    </View>
  );
}
