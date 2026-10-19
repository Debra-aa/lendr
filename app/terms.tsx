// Terms of Use, linked from Sign up. Reachable whether or not someone is signed in.
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../lib/theme';
import { shared } from '../components/ui';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Who can use Lendr',
    body: 'Lendr is for college students. You need a school email address to sign up, and you must give your real name. Keep your password private; you are responsible for what happens on your account.',
  },
  {
    heading: 'No tolerance for objectionable content or abusive users',
    body: 'You may not post anything that is offensive, sexual, hateful, threatening, harassing, misleading, or illegal, and you may not bully, harass, scam, or threaten other students. We do not tolerate this. Content that breaks these rules will be removed, and accounts that post it or abuse other users will be suspended or removed.',
  },
  {
    heading: 'Items you may not list',
    body: 'Do not list anything illegal or dangerous, including weapons, drugs, alcohol, tobacco or vaping products, prescription medication, stolen goods, counterfeit items, or anything your school does not allow on campus. Only list things you own and are allowed to lend.',
  },
  {
    heading: 'Reporting and blocking',
    body: 'Tap Report on any listing, Wanted post, or review that breaks these rules. We review reports within 24 hours and remove content or users that break them. You can also block a user so you no longer see their listings or Wanted posts; manage blocked users from your Profile.',
  },
  {
    heading: 'Rentals are between students',
    body: 'Lendr helps students find each other. Lendr is not a party to a rental and does not handle payments. The owner and the renter agree on pickup, return, and any money directly. Return items on time and in the condition you got them. A deposit may be kept if an item comes back late or damaged.',
  },
  {
    heading: 'Your content',
    body: 'You keep ownership of the photos and text you post. You give Lendr permission to store and show them to other users so the app works. Delete a listing or your account at any time to remove them.',
  },
  {
    heading: 'Disclaimer',
    body: 'Lendr is provided as is. We do not inspect items and cannot guarantee their condition, safety, or that other users will act as promised. To the extent the law allows, Lendr is not responsible for loss, damage, or injury from a rental.',
  },
  {
    heading: 'Ending your account',
    body: 'You can delete your account at any time from Profile. We may suspend or remove accounts that break these terms.',
  },
  {
    heading: 'Changes',
    body: 'We may update these terms. If the changes are significant, we will tell you in the app. Using Lendr after a change means you accept the new terms.',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <Text style={styles.title}>Terms of Use</Text>
      <Text style={shared.muted}>Effective October 19, 2026</Text>
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
