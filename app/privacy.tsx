// Privacy policy, opened from the top bar menu. Keep in step with docs/privacy.html,
// the hosted copy linked from the App Store listing.
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../lib/theme';
import { shared } from '../components/ui';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'In short',
    body: 'Lendr collects only what the app needs to work, never sells your information, and lets you delete your account at any time from Profile.',
  },
  {
    heading: 'Information you give us',
    body: 'Your name, school email and password (stored only in encrypted form). Your campus, worked out from your email. A profile photo if you add one. Your listings, with their photos, condition, pickup spot and prices. Rental requests and their dates, prices and status. Star ratings. Wanted posts. Reports you send and people you block. A contact for pickups (a phone number, Instagram, Snapchat, email or other handle) if you add one. Photos the lender takes of an item at pickup and return.',
  },
  {
    heading: 'Information we do not collect',
    body: 'We do not use your location. Pickup spots are only the text you type. We do not use advertising, analytics or tracking tools. We do not process payments. Lendr only sees the photos you choose or take yourself, and only uses the camera when you take a photo.',
  },
  {
    heading: 'Who can see what',
    body: 'Other signed-in students can see your name, profile photo, campus, verified badge, listings, Wanted posts and the ratings on your items. Your contact for pickups is shown only to the other person on a rental you have approved or that is in progress. Handoff photos are shown only to the lender and renter on that rental. Reports are private. Your email address and password are never shown to other users.',
  },
  {
    heading: 'Who we share it with',
    body: 'We do not sell or rent your information or share it for advertising. Lendr’s data is stored by Supabase, which hosts our database, file storage and sign-in, and processes it only to run Lendr. We may disclose information if the law requires it.',
  },
  {
    heading: 'Keeping and deleting your information',
    body: 'We keep your information while your account exists. Delete your account at any time from Profile: this permanently removes your profile, photos, listings, rentals, reviews, Wanted posts, contact and login. You can remove your contact for pickups or change your name and photo at any time.',
  },
  {
    heading: 'Children',
    body: 'Lendr is for college students and is not directed at children under 13. We do not knowingly collect information from children under 13.',
  },
  {
    heading: 'Changes',
    body: 'If we change this policy we will update the date above, and tell you in the app if the changes are significant.',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <Text style={styles.title}>Privacy policy</Text>
      <Text style={shared.muted}>Effective October 23, 2026</Text>
      {SECTIONS.map((s) => (
        <Text key={s.heading} style={styles.section}>
          <Text style={styles.heading}>{s.heading}{'\n'}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  section: { marginTop: 20 },
  heading: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
});
