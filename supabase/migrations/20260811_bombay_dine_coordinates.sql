-- Bombay Dine had no latitude/longitude, so every home-delivery checkout there
-- failed: the order page requires both the customer's point and the
-- cafeteria's before it will compute a distance, and refused with "Please
-- select a delivery location" no matter what the customer did.
--
-- Values match BOMBAY_DINE_COORDINATES in lib/utils/bombayDineLocation.ts,
-- taken from the restaurant's Google Maps pin. Keep the two in step: the map
-- on the browse page reads the constant, delivery pricing reads these columns.

update cafeterias
set latitude = 13.08500585655609,
    longitude = 77.48652925409827
where name = 'Bombay Dine'
  and (latitude is null or longitude is null);
