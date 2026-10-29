// Lender damage claims: the 48-hour window and the labels each side sees.
// The database enforces the window; these only decide what to show.
import { CLAIM_WINDOW_HOURS, type Booking, type DamageClaimStatus } from '../types/database';

/** Whole hours left to file a claim (0 once the window has closed or never opened). */
export function claimHoursLeft(booking: Pick<Booking, 'completed_at'>, now = Date.now()): number {
  if (!booking.completed_at) return 0;
  const closes = new Date(booking.completed_at).getTime() + CLAIM_WINDOW_HOURS * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((closes - now) / (60 * 60 * 1000)));
}

/** "Available for 31 more hours", "Available for 1 more hour". */
export function claimCountdown(hours: number): string {
  return `Available for ${hours} more ${hours === 1 ? 'hour' : 'hours'}`;
}

export const CLAIM_STATUS_LENDER: Record<DamageClaimStatus, string> = {
  pending: 'Waiting for the renter to respond',
  accepted: 'Renter accepted',
  disputed: 'Renter disputed, under review',
  resolved: 'Resolved by Lendr',
};

export const CLAIM_STATUS_RENTER: Record<DamageClaimStatus, string> = {
  pending: 'Waiting for your response',
  accepted: 'You accepted this',
  disputed: 'Disputed, under review',
  resolved: 'Resolved by Lendr',
};
