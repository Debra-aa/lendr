// How people reach each other once a rental is approved.
import type { KeyboardTypeOptions } from 'react-native';
import type { ContactType } from '../types/database';
import type { IconName } from './theme';

export const CONTACT_INFO: Record<ContactType, {
  label: string; placeholder: string; icon: IconName; keyboard: KeyboardTypeOptions; action: string | null;
}> = {
  phone: { label: 'Phone', placeholder: '(616) 555-0123', icon: 'message-text-outline', keyboard: 'phone-pad', action: 'Text' },
  instagram: { label: 'Instagram', placeholder: '@yourname', icon: 'instagram', keyboard: 'default', action: 'Open Instagram' },
  snapchat: { label: 'Snapchat', placeholder: 'yourname', icon: 'snapchat', keyboard: 'default', action: 'Open Snapchat' },
  email: { label: 'Email', placeholder: 'you@calvin.edu', icon: 'email-outline', keyboard: 'email-address', action: 'Email' },
  other: { label: 'Other', placeholder: 'Discord: yourname', icon: 'card-account-details-outline', keyboard: 'default', action: null },
};

/** The link a tap opens, or null for "other" (shown as plain text). */
export function contactUrl(type: ContactType, value: string): string | null {
  const v = value.trim();
  const handle = v.replace(/^@/, '');
  switch (type) {
    case 'phone': return `sms:${v.replace(/[^\d+]/g, '')}`;
    case 'instagram': return v.startsWith('http') ? v : `https://instagram.com/${encodeURIComponent(handle)}`;
    case 'snapchat': return v.startsWith('http') ? v : `https://www.snapchat.com/add/${encodeURIComponent(handle)}`;
    case 'email': return `mailto:${v}`;
    default: return null;
  }
}
