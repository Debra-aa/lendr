// The Lendr mark: mint reuse arrows on a white rounded badge.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors } from '../lib/theme';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.28, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons name="recycle-variant" size={size * 0.72} color={colors.mint} />
    </View>
  );
}
