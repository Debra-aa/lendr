import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

type Listing = {
  id: string
  title: string
  category: string
  price_cents_per_day: number
  description: string
  image_url?: string | null
}

const CATEGORIES = ['All', 'Bikes', 'Tools', 'Cameras', 'Outdoor']

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase.from('listings').select('*')
      if (error) console.log('Error loading listings:', error.message)
      else setListings(data as Listing[])
      setLoading(false)
    }
    loadListings()
  }, [])

  const filtered = listings.filter((l) => {
    const matchesCat = activeCat === 'All' || l.category === activeCat
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6E7F6A" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>Lend<Text style={styles.brandAccent}>r</Text></Text>
          <View style={styles.avatar}><Text style={styles.avatarText}>D</Text></View>
        </View>
        <Text style={styles.loc}>📍 Brooklyn, NY</Text>
        <Text style={styles.headline}>What do you need today?</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8B857A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bikes, tools, cameras…"
            placeholderTextColor="#A8A296"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map((cat) => {
            const active = cat === activeCat
            return (
              <TouchableOpacity key={cat} onPress={() => setActiveCat(cat)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Two-column grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No listings found. Try another category!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.photoWrap}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.placeholderText}>{item.category}</Text>
                </View>
              )}
              <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardFoot}>
                <Text style={styles.price}>
                  ${(item.price_cents_per_day / 100).toFixed(0)}<Text style={styles.perDay}>/day</Text>
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F3EC' },
  header: { backgroundColor: '#E8E4DB', paddingTop: 58, paddingBottom: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#DAD4C8' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 26, fontWeight: '700', color: '#22201C' },
  brandAccent: { color: '#6E7F6A' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6E7F6A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loc: { color: '#8B857A', fontSize: 13, marginTop: 14, marginBottom: 2 },
  headline: { fontSize: 22, fontWeight: '700', color: '#22201C', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DAD4C8', borderRadius: 14, height: 48, paddingHorizontal: 14 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#22201C' },
  chipRow: { paddingVertical: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDE9E1', marginRight: 9 },
  chipActive: { backgroundColor: '#22201C' },
  chipText: { color: '#3D3A34', fontWeight: '500', fontSize: 13.5 },
  chipTextActive: { color: '#F6F3EC' },
  card: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4DFD5', borderRadius: 16, overflow: 'hidden' },
  photoWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#EDE9E1', position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#B2AB9E', fontWeight: '600', fontSize: 14 },
  badge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(34,32,28,0.72)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  cardBody: { padding: 11 },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: '#22201C', marginBottom: 6, minHeight: 36 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  price: { fontSize: 15.5, fontWeight: '700', color: '#22201C' },
  perDay: { fontSize: 11, fontWeight: '500', color: '#8B857A' },
  empty: { textAlign: 'center', color: '#8B857A', padding: 40, fontSize: 14 },
})