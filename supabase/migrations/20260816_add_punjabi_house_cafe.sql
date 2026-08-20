-- Add The Punjabi House cafeteria
INSERT INTO cafeterias (
  name,
  vendor_email,
  location,
  image_emoji,
  description,
  is_open,
  latitude,
  longitude
) VALUES (
  'The Punjabi House',
  'punjabihouse@yoters.com',
  'Acharya College Road Gate 3 Opposite',
  '🏠',
  'Authentic Punjabi cuisine - VEG | NON-VEG | HALAL. Family Restaurant serving traditional Indian food.',
  true,
  13.085468952875958,
  77.486715781298
) ON CONFLICT DO NOTHING;
