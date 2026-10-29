// Reporting and blocking, required by the App Store for apps where students
// see each other's content. The database fills in reporter_id and blocker_id
// from the signed-in user, and hides blocked users' content on its own.
import { supabase } from './supabase';
import type { ReportReason, ReportTarget } from '../types/database';
import { confirmAction, notify } from './confirm';

export const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  scam: 'Scam or fraud',
  inappropriate: 'Inappropriate content',
  harassment: 'Harassment or bullying',
  prohibited_item: 'Prohibited item',
  deposit_dispute: 'Deposit issue',
  other: 'Something else',
};

/** Supabase errors are plain objects, not always Error instances, so read .message directly. */
export function errorMessage(e: unknown): string {
  const message = (e as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : 'Please try again.';
}

export async function submitReport(target: ReportTarget, reason: ReportReason, details: string) {
  const { error } = await supabase.from('reports').insert({ ...target, reason, details: details.trim() || null });
  if (error) throw error;
}

/** Asks first, then blocks. onBlocked runs only after the block is saved. */
export async function confirmBlock(userId: string, name: string, onBlocked: () => void) {
  const confirmed = await confirmAction(
    `Block ${name}?`,
    'You will no longer see their listings or Wanted posts. You can unblock them later from your Profile.',
    'Block',
  );
  if (!confirmed) return;
  const { error } = await supabase.from('blocks').insert({ blocked_id: userId });
  if (error) notify('Could not block', error.message);
  else onBlocked();
}

export async function unblockUser(userId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocked_id', userId);
  if (error) throw error;
}
