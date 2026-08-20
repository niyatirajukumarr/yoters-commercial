-- Add The Punjabi House cafeteria
INSERT INTO cafeterias (
  name,
  vendor_email,
  location,
  image_emoji,
  description,
  is_open
) VALUES (
  'The Punjabi House',
  'punjabihouse@yoters.com',
  'Acharya College Road Gate 3 Opposite',
  '🏠',
  'Authentic Punjabi cuisine - VEG | NON-VEG | HALAL. Family Restaurant serving traditional Indian food.',
  true
) ON CONFLICT DO NOTHING;
