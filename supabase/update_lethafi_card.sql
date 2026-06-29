-- Update LETHAFI's browse-page card details (image, location, description)
update cafeterias
set
  image_url = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=1000&h=700&fit=crop',
  location = 'Acharya College Road',
  description = 'Fresh juices, thick shakes, burgers, and wraps. Cool drinks, hot bites, good vibes!'
where name = 'LETHAFI';
