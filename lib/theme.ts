import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

// Charcoal & Mint, the approved Lendr design.
export const colors = {
  paper: '#FFFFFF',    // app background
  card: '#FFFFFF',
  ink: '#141A21',       // main text
  muted: '#56606B',     // secondary text
  line: '#D7DDE1',      // borders
  mint: '#DC2626',      // buttons and selected states, now red (was #0F9F76)      // buttons and selected states
  pink: '#FB7185',      // accent: + button, offers
  heroTop: '#2B3440',   // header gradient
  heroBottom: '#111827',
   motto: '#FCA5A5', 
  rim: '#141A21',       // listing card outline and shadow
  danger: '#B03A2E',
  tags: ['#FECACA', '#FFD0D6', '#D3DEE8', '#E9E4D8'],
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
