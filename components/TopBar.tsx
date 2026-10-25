// Airbnb-style top bar on every tab: logo and wordmark on the left; "List an item"
// (Browse only), the student's avatar and a menu button on the right. On Browse it
// also shows the search pill: search text, a category picker and a red search button.
import { useRef, useState, type ReactNode } from 'react';
import {
  Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { colors, iconFor, radius, type IconName } from '../lib/theme';
import { CATEGORIES } from '../types/database';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

const BORDER = colors.line;
const PILL_BORDER = colors.line;
const GRAY_CIRCLE = colors.raised;
const AVATAR_BG = colors.tags[0];
export const ANY_CATEGORY = 'All';

type SearchProps = {
  value: string;
  onChangeText: (text: string) => void;
  category: string; // ANY_CATEGORY or one of CATEGORIES
  onCategory: (category: string) => void;
};

type Props = { showListButton?: boolean; search?: SearchProps };

export function TopBar({ showListButton, search }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function go(path: Parameters<typeof router.navigate>[0]) {
    setMenuOpen(false);
    router.navigate(path);
  }

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Logo size={34} radius={10} background={colors.logoTint} />
          <Text style={styles.wordmark}>lendr</Text>
        </View>

        <View style={styles.actions}>
          {showListButton ? (
            <Pressable onPress={() => router.navigate('/create')} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.listButton}>List an item</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.navigate('/profile')} accessibilityRole="button" accessibilityLabel="Your profile">
            <Avatar
              name={profile?.full_name || session?.user.email}
              url={profile?.avatar_url}
              size={38}
              background={AVATAR_BG}
              textColor={colors.mint}
            />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton} accessibilityRole="button" accessibilityLabel="Menu">
            <MaterialCommunityIcons name="menu" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {search ? <SearchPill {...search} /> : null}

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <MenuItem icon="account-circle-outline" label="Profile" onPress={() => go('/profile')} />
        <MenuItem icon="clipboard-text-outline" label="My rentals" onPress={() => go('/rentals')} />
        <MenuItem icon="cog-outline" label="Settings" onPress={() => go('/settings')} />
      </Sheet>
    </View>
  );
}

function SearchPill({ value, onChangeText, category, onCategory }: SearchProps) {
  const input = useRef<TextInput>(null);
  const [picking, setPicking] = useState(false);
  const anyCategory = category === ANY_CATEGORY;

  function choose(next: string) {
    setPicking(false);
    onCategory(next);
  }

  return (
    <View style={styles.pill}>
      <Pressable style={styles.segment} onPress={() => input.current?.focus()} accessibilityLabel="Search items">
        <Text style={styles.segmentLabel}>Anything</Text>
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search items"
          placeholderTextColor={colors.muted}
          style={styles.segmentInput}
          returnKeyType="search"
          autoCorrect={false}
        />
      </Pressable>
      <View style={styles.divider} />
      <Pressable style={styles.segment} onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel="Choose a category">
        <Text style={styles.segmentLabel} numberOfLines={1}>{anyCategory ? 'Any category' : category}</Text>
        <Text style={styles.segmentSub} numberOfLines={1}>{anyCategory ? 'Tech, Outdoors…' : 'Tap to change'}</Text>
      </Pressable>
      <Pressable
        style={styles.searchButton}
        // With text, this just closes the keyboard to show results; when empty, it starts a search.
        onPress={() => (value.trim() ? Keyboard.dismiss() : input.current?.focus())}
        accessibilityRole="button"
        accessibilityLabel="Search"
      >
        <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
      </Pressable>

      <Sheet visible={picking} onClose={() => setPicking(false)} title="Category">
        {[ANY_CATEGORY, ...CATEGORIES].map((c) => (
          <MenuItem
            key={c}
            icon={c === ANY_CATEGORY ? 'view-grid-outline' : iconFor(c)}
            label={c === ANY_CATEGORY ? 'Any category' : c}
            selected={c === category}
            onPress={() => choose(c)}
          />
        ))}
      </Sheet>
    </View>
  );
}

/** Bottom sheet used for the menu and the category picker. */
function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type MenuItemProps = { icon: IconName; label: string; onPress: () => void; selected?: boolean };

function MenuItem({ icon, label, onPress, selected }: MenuItemProps) {
  const color = colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: GRAY_CIRCLE }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.itemText, { color }]}>{label}</Text>
      {selected ? <MaterialCommunityIcons name="check" size={20} color={colors.mint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: BORDER, paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { color: colors.logo, fontSize: 25, fontWeight: '800', letterSpacing: -0.8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listButton: { fontSize: 14, fontWeight: '700', color: colors.ink, marginRight: 2 },
  menuButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: GRAY_CIRCLE, alignItems: 'center', justifyContent: 'center' },

  pill: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: colors.card,
    borderWidth: 1, borderColor: PILL_BORDER, borderRadius: radius.pill, paddingLeft: 18, paddingRight: 6, paddingVertical: 6,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
  },
  segment: { flex: 1, justifyContent: 'center', minHeight: 40 },
  segmentLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  segmentInput: { fontSize: 13, color: colors.ink, padding: 0, marginTop: 1 },
  segmentSub: { fontSize: 13, color: colors.muted, marginTop: 1 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 6, marginHorizontal: 12, backgroundColor: PILL_BORDER },
  searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 8, paddingHorizontal: 8, maxHeight: '80%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, paddingHorizontal: 12, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 14, borderRadius: radius.md },
  itemText: { flex: 1, fontSize: 16 },
});
