-- In-app account deletion (required by App Store Review Guideline 5.1.1(v)).
-- Paste into Supabase Dashboard -> SQL Editor and run once.
--
-- Deletes everything that belongs to the signed-in user, children first so it
-- works whether or not the foreign keys cascade. It all runs in one transaction:
-- if any step fails, nothing is deleted.
-- Photos in Storage are removed by the app before it calls this function.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  -- Reviews on bookings this user was part of, as renter or as owner.
  delete from public.reviews
  where booking_id in (
    select b.id from public.bookings b
    join public.listings l on l.id = b.listing_id
    where b.renter_id = uid or l.owner_id = uid
  );

  -- Bookings they made, and bookings of their items.
  delete from public.bookings
  where renter_id = uid
     or listing_id in (select id from public.listings where owner_id = uid);

  delete from public.listing_images
  where listing_id in (select id from public.listings where owner_id = uid);

  delete from public.listings where owner_id = uid;
  delete from public.wanted_requests where requester_id = uid;
  delete from public.profiles where id = uid;

  -- Finally the login itself.
  delete from auth.users where id = uid;
end;
$$;

-- Only signed-in users can call it, and it only ever deletes the caller.
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
