// Shapes of the rows the app reads from Supabase.
// They mirror the tables in the database; embedded objects come from joins in select().

export const CATEGORIES = ['Outdoors', 'Tech', 'Tools', 'Study', 'Fun', 'Dorm', 'Other'] as const;
export const OTHER_CATEGORY = 'Other';
export const CATEGORY_DETAIL_MAX = 25; // matches the check on listings.category_detail
export type Category = (typeof CATEGORIES)[number];

// Matches the condition check on listings, in order from best to worst.
export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'well_used'] as const;
export type Condition = (typeof CONDITIONS)[number];
export const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  well_used: 'Well used',
};

export type ListingImage = { storage_path: string; position: number };

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  category: string | null;
  category_detail: string | null; // only set when category is Other, e.g. "Costume"
  price_cents_per_day: number;
  deposit_cents: number;
  description: string | null;
  pickup_location: string | null;
  condition: Condition | null; // null on listings made before conditions existed
  is_available: boolean;
  created_at: string;
  listing_images: ListingImage[];
  profiles: { full_name: string | null; campus: string | null } | null;
};

export type BookingStatus = 'requested' | 'approved' | 'declined' | 'cancelled' | 'active' | 'completed';

export type Booking = {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_cents: number;
  deposit_cents: number;
  status: BookingStatus;
  created_at: string;
  listings: {
    title: string;
    category: string | null;
    owner_id: string;
    listing_images: ListingImage[];
    profiles: { full_name: string | null } | null;
  } | null;
  profiles: { full_name: string | null } | null; // the renter
  reviews: { id: string }[];
  booking_photos: BookingPhoto[];
  // The renter's answer to "Did you get your deposit back?", set once after the return.
  deposit_return: DepositReturn | null;
  deposit_confirmed_at: string | null;
  completed_at: string | null; // set by the database when the rental is marked returned
};

export type DepositReturn = 'full' | 'partial' | 'none';

/**
 * A lender keeping part or all of a deposit. One per rental, filed within 48 hours of
 * completed_at; the renter accepts or disputes it once. Matches the damage_claims checks.
 */
export const DAMAGE_REASONS = ['damage', 'missing_parts', 'late_return', 'other'] as const;
export type DamageReason = (typeof DAMAGE_REASONS)[number];
export const DAMAGE_REASON_LABELS: Record<DamageReason, string> = {
  damage: 'Damage',
  missing_parts: 'Missing parts',
  late_return: 'Late return',
  other: 'Other',
};
export const CLAIM_WINDOW_HOURS = 48;
export const CLAIM_DETAILS_MAX = 1000;
export type DamageClaimStatus = 'pending' | 'accepted' | 'disputed' | 'resolved';
export type DamageClaim = {
  id: string;
  booking_id: string;
  lender_id: string;
  reason: DamageReason;
  amount_kept_cents: number;
  details: string;
  status: DamageClaimStatus;
  renter_response: string | null;
  responded_at: string | null;
  created_at: string;
};

/** Photos the lender takes at handoff. Files live in the private handoff-photos bucket. */
export type HandoffKind = 'pickup' | 'return' | 'damage';
export type BookingPhoto = { kind: HandoffKind; storage_path: string; created_at: string };

// Matches the contact_type check on profile_contacts.
export const CONTACT_TYPES = ['phone', 'instagram', 'snapchat', 'email', 'other'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];
export const CONTACT_VALUE_MAX = 80;
export type ProfileContact = { user_id: string; contact_type: ContactType; contact_value: string };

export type WantedRequest = {
  id: string;
  requester_id: string;
  title: string;
  details: string | null;
  offer_cents_per_day: number | null;
  status: 'open' | 'fulfilled' | 'closed';
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export type Campus = { id: string; name: string; email_domain: string };

export type Profile = {
  id: string;
  full_name: string | null;
  location: string | null;
  avatar_url: string | null;
  campus: string | null;     // set automatically from the school email
  campus_id: string | null;
  is_verified: boolean;      // true once a school email is confirmed
  verified_at: string | null;
};

// Reasons a student can pick when reporting something. Must match the
// reason check constraint on the reports table. deposit_dispute only applies
// to a rental (a report with booking_id).
export const REPORT_REASONS = ['spam', 'scam', 'inappropriate', 'harassment', 'prohibited_item', 'deposit_dispute', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** What is being reported: one piece of content (or none) plus the person behind it. */
export type ReportTarget = {
  reported_user_id: string;
  listing_id?: string;
  wanted_request_id?: string;
  review_id?: string;
  booking_id?: string;
};
