import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

// Dark theme: black background, dark gray cards, white text, and the logo's green as the accent.
export const colors = {
  paper: '#000000',     // app background
  card: '#1C1C1E',      // cards, inputs, tab bar
  raised: '#2C2C2E',    // gray circles, pressed rows, small badges
  ink: '#FFFFFF',       // main text
  muted: '#A1A1AA',     // secondary text
  line: '#38383A',      // borders and dividers
  mint: '#0F9F76',      // buttons and selected states: the same green as the logo
  logo: '#0F9F76',      // the recycle mark and "lendr" wordmark
  logoTint: '#DFF5EC',  // light green behind the mark in the top bar
  pink: '#FB7185',      // accent: + button, offers
  heroTop: '#2B3440',   // banner gradient
  heroBottom: '#111827',
  motto: '#7EE8C4',     // light green text on the charcoal banners
  rim: '#3A3A3C',       // photo and tag outlines
  danger: '#FF453A',    // destructive actions like Delete, readable on black
  tags: ['#123D31', '#3A2228', '#22303D', '#36312A'], // dark tints behind icons and pills
};

export const radius = { sm: 10, md: 14, lg: 16, xl: 22, pill: 999 };

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icon shown on a listing's tag when it has no photo yet.
const categoryIcons: Record<string, IconName> = {
  Outdoors: 'tent',
  Tech: 'camera-outline',
  Tools: 'hammer-wrench',
  Study: 'calculator-variant-outline',
  Fun: 'dice-5-outline',
  Dorm: 'lamp-outline',
  Other: 'shape-outline',
};

export function iconFor(category: string | null): IconName {
  return (category && categoryIcons[category]) || 'tag-outline';
}

/** Picks the same tag color for a listing every time, based on its id. */
export function tagColor(id: string): string {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return colors.tags[sum % colors.tags.length];
}
