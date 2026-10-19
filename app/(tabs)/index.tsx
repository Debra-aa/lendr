import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { LISTING_SELECT } from '../../lib/queries';
import { colors, radius } from '../../lib/theme';
import { CATEGORIES, type Listing } from '../../types/database';
import { ListingCard } from '../../components/ListingCard';
import { Button, Chip, Empty, Title, shared } from '../../components/ui';

export default function BrowseScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setListings(data as Listing[]);
    }
    setLoading(false);
  }, []);

  // Reload every time this tab comes into view, so new listings show up right away.
  useFocusEffect(useCallback(() => { loadListings(); }, [loadListings]));

  async function refresh() {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  }

  const query = search.trim().toLowerCase();
  // Search also matches the "kind" typed on Other listings, so "costume" finds Other · Costume.
  const visible = listings.filter((l) =>
    (category === 'All' || l.category === category) &&
    (!query || l.title.toLowerCase().includes(query) || (l.category_detail ?? '').toLowerCase().includes(query)),
  );

  const header = (
    <View>
      <Title sub="Rent what you need for a day or a week. Give it back, get your deposit back.">
          Are you ready to eat your cake and have it?
      </Title>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tents, calculators, drills"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {['All', ...CATEGORIES].map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return <View style={[shared.screen, styles.center]}><ActivityIndicator size="large" color={colors.mint} /></View>;
  }

  return (
    <FlatList
      style={shared.screen}
      contentContainerStyle={[shared.content, { gap: 14 }]}
      columnWrapperStyle={{ gap: 14 }}
      data={visible}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mint} />}
      ListEmptyComponent={
        error ? (
          <Empty message={`Listings could not load: ${error}`} action={<Button label="Try again" variant="ghost" onPress={refresh} />} />
        ) : (
          <Empty
            message="Nothing matches that yet. Post it on the Wanted board and someone may have one."
            action={<Button label="Post on Wanted" variant="ghost" onPress={() => router.push('/wanted')} />}
          />
        )
      }
      renderItem={({ item }) => (
        <View style={{ flex: 1 / 2 }}>
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink },
  chips: { marginTop: 12, marginBottom: 2 },
});
