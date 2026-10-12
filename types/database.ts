// Shapes of the rows the app reads from Supabase.
// They mirror the tables in the database; embedded objects come from joins in select().

export const CATEGORIES = ['Outdoors', 'Tech', 'Tools', 'Study', 'Fun', 'Dorm'] as const;
export type Category = (typeof CATEGORIES)[number];

export type ListingImage = { storage_path: string; position: number };

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  category: string | null;
  price_cents_per_day: number;
  deposit_cents: number;
  description: string | null;
  pickup_location: string | null;
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
};

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

export type Profile = {
  id: string;
  full_name: string | null;
  location: string | null;
  campus: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};
