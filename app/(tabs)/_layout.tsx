import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Banner } from '../../components/Banner';
import { colors, type IconName } from '../../lib/theme';

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          header: () => <Banner />,
          sceneStyle: { backgroundColor: colors.paper },
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
          tabBarLabelStyle: { fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Browse', tabBarIcon: tabIcon('view-grid-outline') }} />
        <Tabs.Screen name="wanted" options={{ title: 'Wanted', tabBarIcon: tabIcon('message-text-outline') }} />
        <Tabs.Screen
          name="create"
          options={{
            title: 'List',
            tabBarAccessibilityLabel: 'List an item',
            tabBarIcon: () => (
              <View style={styles.plus}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.ink} />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="rentals" options={{ title: 'My rentals', tabBarIcon: tabIcon('clipboard-text-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-outline') }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  plus: { width: 34, height: 34, backgroundColor: colors.maize, alignItems: 'center', justifyContent: 'center' },
});
