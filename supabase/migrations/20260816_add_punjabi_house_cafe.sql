-- Add The Punjabi House (Swaad Desi) cafeteria
INSERT INTO cafeterias (
  vendor_email,
  vendor_password_hash,
  name,
  description,
  location,
  image_url,
  image_emoji,
  is_open,
  is_closed,
  upi_id
) VALUES (
  'punjabihouse@yoters.com',
  crypt('TPH3234', gen_salt('bf')),
  'The Punjabi House',
  'Authentic Punjabi cuisine - VEG | NON-VEG | HALAL. Family Restaurant serving traditional Indian food.',
  'Acharya College Road Gate 3 Opposite',
  NULL,
  '🏠',
  true,
  false,
  NULL
);
