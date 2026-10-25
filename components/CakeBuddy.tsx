// Lendr's mascot: an original cartoon student holding a slice of cake,
// with a comic speech bubble. Drawn with vector shapes (react-native-svg).
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export function CakeBuddy({ size = 118 }: { size?: number }) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Are you ready to eat your cake and have it?">
      <Svg width={size} height={size * (140 / 130)} viewBox="0 0 130 140">
        <Path d="M26 140 C26 102 40 86 62 86 C84 86 98 102 98 140 Z" fill="#DC2626"/>
        <Path d="M46 88 Q62 100 78 88" fill="none" stroke="#B91C1C" strokeWidth="4" strokeLinecap="round"/>
        <Path d="M55 95 L54 108" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"/>
        <Path d="M69 95 L70 108" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"/>
        <Circle cx="62" cy="124" r="7" fill="#FFFFFF"/>
        <Path d="M59 121.5 A4 4 0 0 1 65.5 122.5 M66 126 A4 4 0 0 1 61 128.5 M58 127 A4 4 0 0 1 57.8 122.6" fill="none" stroke="#0F9F76" strokeWidth="1.8" strokeLinecap="round"/>
        <Path d="M34 104 L28 124" stroke="#DC2626" strokeWidth="13" strokeLinecap="round"/>
        <Circle cx="27.5" cy="127" r="6.5" fill="#8D5A3B"/>
        <Path d="M88 104 L102 84" stroke="#DC2626" strokeWidth="13" strokeLinecap="round"/>
        <Circle cx="103.5" cy="81" r="6.5" fill="#8D5A3B"/>
        <G>
        <Path d="M90 76 L124 76 L124 60 Z" fill="#F7D9A8" stroke="#141A21" strokeWidth="2" strokeLinejoin="round"/>
        <Path d="M100 70.5 L124 70.5" stroke="#FFF3E0" strokeWidth="3"/>
        <Path d="M88 76 L124 58 L124 54 Q118 52 114 56 Q108 54 104 60 Q98 60 96 65 Q90 67 88 72 Z" fill="#FF9EC7" stroke="#141A21" strokeWidth="2" strokeLinejoin="round"/>
        <Circle cx="119" cy="50" r="4.5" fill="#DC2626" stroke="#141A21" strokeWidth="1.6"/>
        <Path d="M120 46 Q122 41 126 40" fill="none" stroke="#0F9F76" strokeWidth="1.8" strokeLinecap="round"/>
        </G>
        <Circle cx="33" cy="52" r="6.5" fill="#7A4B30"/>
        <Circle cx="91" cy="52" r="6.5" fill="#7A4B30"/>
        <Circle cx="62" cy="50" r="30" fill="#8D5A3B"/>
        <G fill="#24170F">
        <Path d="M33 46 C32 24 46 16 62 16 C78 16 92 24 91 46 C86 36 78 32 62 32 C46 32 38 36 33 46 Z"/>
        <Circle cx="38" cy="30" r="8"/><Circle cx="48" cy="22" r="8.5"/><Circle cx="60" cy="19" r="9"/>
        <Circle cx="72" cy="21" r="8.5"/><Circle cx="83" cy="28" r="8"/><Circle cx="88" cy="38" r="6"/><Circle cx="35" cy="39" r="6"/>
        </G>
        <Ellipse cx="51" cy="52" rx="4" ry="5" fill="#141A21"/>
        <Ellipse cx="73" cy="52" rx="4" ry="5" fill="#141A21"/>
        <Circle cx="52.4" cy="50.3" r="1.5" fill="#FFFFFF"/>
        <Circle cx="74.4" cy="50.3" r="1.5" fill="#FFFFFF"/>
        <Path d="M45 43.5 Q51 40.5 56 43" fill="none" stroke="#24170F" strokeWidth="2.4" strokeLinecap="round"/>
        <Path d="M68 43 Q73 40.5 79 43.5" fill="none" stroke="#24170F" strokeWidth="2.4" strokeLinecap="round"/>
        <Circle cx="44" cy="62" r="4.5" fill="#E9897E" opacity="0.55"/>
        <Circle cx="80" cy="62" r="4.5" fill="#E9897E" opacity="0.55"/>
        <Path d="M52 63 Q62 76 72 63 Z" fill="#6E2A2A" stroke="#24170F" strokeWidth="2" strokeLinejoin="round"/>
        <Path d="M55.5 66.5 Q62 71 68.5 66.5" fill="none" stroke="#F28B8B" strokeWidth="2.6" strokeLinecap="round"/>
      </Svg>

      <View style={styles.bubbleWrap}>
        <View style={styles.bubble}>
          <Text style={styles.text}>
            Are you ready to eat your cake <Text style={{ color: colors.mint }}>and have it?</Text>
          </Text>
        </View>
        {/* Speech bubble tail: a dark triangle with a white one on top */}
        <View style={styles.tailOuter} />
        <View style={styles.tailInner} />
      </View>
    </View>
  );
}

const INK = '#141A21';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 6 },
  bubbleWrap: { flex: 1, marginBottom: 56 },
  bubble: {
    backgroundColor: '#fff', borderWidth: 2.5, borderColor: INK, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 12,
    // solid comic-style shadow
    shadowColor: INK, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  text: { fontSize: 18, fontWeight: '800', lineHeight: 23, color: INK },
  tailOuter: {
    position: 'absolute', left: -14, bottom: 14, width: 0, height: 0,
    borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: INK,
  },
  tailInner: {
    position: 'absolute', left: -9, bottom: 17, width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff',
  },
});