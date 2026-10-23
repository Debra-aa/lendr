import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type IconName } from '../../lib/theme';

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          // No header: each tab starts right below the status bar / notch.
          headerShown: false,
          sceneStyle: { backgroundColor: colors.paper, paddingTop: insets.top },
          tabBarActiveTintColor: colors.mint,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
          tabBarLabelStyle: { fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Browse', tabBarIcon: tabIcon('view-grid-outline') }} />
        <Tabs.Screen
          name="wanted"
          options={{
            title: 'Wanted',
            tabBarIcon: tabIcon('message-alert-outline'),
            // No top padding: the Wanted banner runs up under the status bar itself.
            sceneStyle: { backgroundColor: colors.paper },
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'List',
            tabBarAccessibilityLabel: 'List an item',
            tabBarIcon: () => (
              <View style={styles.plus}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="rentals" options={{ title: 'My rentals', tabBarIcon: tabIcon('clipboard-text-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-circle-outline') }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  plus: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.pink,
    alignItems: 'center', justifyContent: 'center',
  },
});
