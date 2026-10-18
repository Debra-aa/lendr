import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../lib/theme';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.paper } }} />
    </>
  );
}
