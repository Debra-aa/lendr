import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Listing = {
  id: string
  title: string
  category: string
  price_cents_per_day: number
  description: string
}

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase.from('listings').select('*')
      if (error) {
        console.log('Error loading listings:', error.message)
      } else {
        setListings(data as Listing[])
      }
      setLoading(false)
    }
    loadListings()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lendr</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardPrice}>
              ${(item.price_cents_per_day / 100).toFixed(2)} / day
            </Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f5f5f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardCategory: { fontSize: 14, color: '#666', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '600', marginTop: 8 },
})