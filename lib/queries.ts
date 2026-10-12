// Select strings shared by several screens. Each one joins related tables
// in a single request (Supabase follows the foreign keys).

/** A listing with its photos and its owner's name and campus. */
export const LISTING_SELECT = '*, listing_images(storage_path, position), profiles(full_name, campus)';

/**
 * A booking with the listing (and its owner), the renter's name, and any review.
 * listings!inner means only bookings whose listing still exists are returned,
 * and lets us filter by listings.owner_id for the Lending tab.
 */
export const BOOKING_SELECT =
  '*, listings!inner(title, category, owner_id, listing_images(storage_path, position), profiles(full_name)), profiles(full_name), reviews(id)';
