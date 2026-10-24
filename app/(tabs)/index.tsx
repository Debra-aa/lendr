import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { LISTING_SELECT } from '../../lib/queries';
import { colors } from '../../lib/theme';
import type { Listing } from '../../types/database';
import { ListingCard } from '../../components/ListingCard';
import { ANY_CATEGORY, TopBar } from '../../components/TopBar';
import { Button, Empty, Title, shared } from '../../components/ui';

export default function BrowseScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ANY_CATEGORY);

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
    (category === ANY_CATEGORY || l.category === category) &&
    (!query || l.title.toLowerCase().includes(query) || (l.category_detail ?? '').toLowerCase().includes(query)),
  );

  const header = (
    <Title sub="Rent what you need for a day or a week. Give it back, get your deposit back.">
      Are you ready to eat your cake and have it?
    </Title>
  );

  const topBar = (
    <TopBar showListButton search={{ value: search, onChangeText: setSearch, category, onCategory: setCategory }} />
  );

  if (loading) {
    return (
      <View style={shared.screen}>
        {topBar}
        <View style={styles.center}><ActivityIndicator size="large" color={colors.mint} /></View>
      </View>
    );
  }

  return (
    <View style={shared.screen}>
      {topBar}
      <FlatList
        style={shared.screen}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[shared.content, { gap: 18 }]}
        columnWrapperStyle={{ gap: 18 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
