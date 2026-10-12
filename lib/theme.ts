import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

// Colors match the approved Lendr design (darker scheme).
export const colors = {
  paper: '#DDE3E8',
  card: '#F4F6F8',
  ink: '#1E2A3A',
  muted: '#46525F',
  line: '#A9B6C1',
  maize: '#D9A514',
  teal: '#155E54',
  rim: '#000000',
  danger: '#B03A2E',
  tags: ['#E6C45E', '#86BFAF', '#88AFD1', '#D6979E'],
};

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icon shown on a listing's tag when it has no photo yet.
const categoryIcons: Record<string, IconName> = {
  Outdoors: 'tent',
  Tech: 'camera-outline',
  Tools: 'hammer-wrench',
  Study: 'calculator-variant-outline',
  Fun: 'dice-5-outline',
  Dorm: 'lamp-outline',
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
