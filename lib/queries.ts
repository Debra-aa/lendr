// Select strings shared by several screens. Each one joins related tables
// in a single request (Supabase follows the foreign keys).

/** A listing with its photos and its owner's name and campus. */
export const LISTING_SELECT = '*, listing_images(storage_path, position), profiles(full_name, campus)';

/**
 * A booking with the listing (and its owner), the renter's name, any review,
 * and the pickup/return photos.
 * listings!inner lets the Lending tab filter by listings.owner_id.
 */
export const BOOKING_SELECT =
  '*, listings!inner(title, category, owner_id, listing_images(storage_path, position), profiles(full_name)), profiles(full_name), reviews(id), booking_photos(kind, storage_path, created_at)';
