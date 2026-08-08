-- Add Bombay Dine cafeteria
INSERT INTO cafeterias (
  name,
  vendor_email,
  location,
  image_emoji,
  description,
  is_open
) VALUES (
  'Bombay Dine',
  'bombaydine@yoters.com',
  'Acharya College Road',
  '🍜',
  'Authentic Bombay Street Food & Beverages',
  true
) ON CONFLICT DO NOTHING;
