-- The vendor's "Open in Google Maps" link only had the reverse-geocoded
-- text address to work with, so Maps could only do a best-effort text
-- search — no exact pin. The map picker (DeliveryMapModal) always has the
-- precise lat/lng behind that address (from GPS, a map tap/drag, or a
-- search-suggestion pick); it just wasn't being persisted. Store it so the
-- vendor can link straight to the exact point instead of a text guess.
alter table orders
  add column if not exists delivery_latitude double precision,
  add column if not exists delivery_longitude double precision;
