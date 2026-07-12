-- Add LETHAFI restaurant + full menu
-- Run in your NEW Supabase project's SQL Editor

insert into cafeterias (name, description, location, image_emoji, vendor_email, is_open)
values ('LETHAFI', 'Let''s thafi bout it!', 'Location TBD', '🥤', 'lethafi@yoters.com', true);

-- Get the new cafeteria id for inserts below
do $$
declare
  v_caf_id uuid;
begin
  select id into v_caf_id from cafeterias where name = 'LETHAFI' order by created_at desc limit 1;

  insert into cafeteria_menu (cafeteria_id, name, category, price, is_available) values
  -- Fresh Juices
  (v_caf_id, 'Lemon', 'Fresh Juices', 30, true),
  (v_caf_id, 'Lemon Mint', 'Fresh Juices', 30, true),
  (v_caf_id, 'Moroccan Lime', 'Fresh Juices', 30, true),
  (v_caf_id, 'Grape Lemon', 'Fresh Juices', 30, true),
  (v_caf_id, 'Musambi', 'Fresh Juices', 40, true),
  (v_caf_id, 'Orange', 'Fresh Juices', 40, true),
  (v_caf_id, 'Watermelon', 'Fresh Juices', 40, true),
  (v_caf_id, 'Muskmelon', 'Fresh Juices', 40, true),
  (v_caf_id, 'Pappaya', 'Fresh Juices', 40, true),
  (v_caf_id, 'Pineapple', 'Fresh Juices', 40, true),
  (v_caf_id, 'Grape', 'Fresh Juices', 40, true),
  (v_caf_id, 'Kokum', 'Fresh Juices', 40, true),
  (v_caf_id, 'Mango', 'Fresh Juices', 50, true),
  (v_caf_id, 'Pomegranate', 'Fresh Juices', 50, true),

  -- Mojito's
  (v_caf_id, 'Virgin Mojito', 'Mojitos', 60, true),
  (v_caf_id, 'Blue Ocean', 'Mojitos', 60, true),
  (v_caf_id, 'Kiwi Cooler', 'Mojitos', 60, true),
  (v_caf_id, 'Greenade', 'Mojitos', 60, true),
  (v_caf_id, 'Black Current Night', 'Mojitos', 70, true),
  (v_caf_id, 'Melody Melon', 'Mojitos', 70, true),
  (v_caf_id, 'Blueberry Martini', 'Mojitos', 70, true),

  -- Hot Beverages
  (v_caf_id, 'Coffee', 'Hot Beverages', 20, true),
  (v_caf_id, 'Boost', 'Hot Beverages', 20, true),
  (v_caf_id, 'Horlicks', 'Hot Beverages', 20, true),

  -- Fruit Milkshakes
  (v_caf_id, 'Apple Milkshake', 'Fruit Milkshakes', 50, true),
  (v_caf_id, 'Muskmelon Milkshake', 'Fruit Milkshakes', 50, true),
  (v_caf_id, 'Pappaya Milkshake', 'Fruit Milkshakes', 50, true),
  (v_caf_id, 'Banana Milkshake', 'Fruit Milkshakes', 50, true),
  (v_caf_id, 'Mango Milkshake', 'Fruit Milkshakes', 50, true),
  (v_caf_id, 'Pomegranate Milkshake', 'Fruit Milkshakes', 60, true),
  (v_caf_id, 'Avocado Milkshake', 'Fruit Milkshakes', 60, true),
  (v_caf_id, 'Cocktail Milkshake', 'Fruit Milkshakes', 70, true),

  -- Thick Shake
  (v_caf_id, 'Horlicks Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Boost Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Badam Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Black Current Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Green Apple Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Pista Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Litchi Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Oreo Thick Shake', 'Thick Shake', 50, true),
  (v_caf_id, 'Crunchy Oreo Thick Shake', 'Thick Shake', 60, true),
  (v_caf_id, 'Rose Milk Thick Shake', 'Thick Shake', 60, true),
  (v_caf_id, 'Dates Thick Shake', 'Thick Shake', 65, true),
  (v_caf_id, 'Blueberry Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Fig Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Sharjah Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Tender Coconut Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Snickers Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Kitkat Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Jack Fruit Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Cashew Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Chocolate Sharjah Thick Shake', 'Thick Shake', 70, true),
  (v_caf_id, 'Dry Fruit Mix Thick Shake', 'Thick Shake', 80, true),
  (v_caf_id, 'Biscoff Thick Shake', 'Thick Shake', 80, true),

  -- Soda's
  (v_caf_id, 'Lemon Soda', 'Sodas', 30, true),
  (v_caf_id, 'Masala Soda', 'Sodas', 35, true),
  (v_caf_id, 'Mint Soda', 'Sodas', 40, true),
  (v_caf_id, 'Blue Lemonade', 'Sodas', 40, true),
  (v_caf_id, 'Ginger Lemonade', 'Sodas', 40, true),
  (v_caf_id, 'Peach Ice', 'Sodas', 40, true),
  (v_caf_id, 'Jeera Masala', 'Sodas', 40, true),
  (v_caf_id, 'Hannari', 'Sodas', 40, true),

  -- Coffee Shake
  (v_caf_id, 'Frappuccino', 'Coffee Shake', 50, true),
  (v_caf_id, 'Cold Coffee', 'Coffee Shake', 50, true),
  (v_caf_id, 'Chocolate Coffee', 'Coffee Shake', 60, true),

  -- Special Shakes
  (v_caf_id, 'Abood', 'Special Shakes', 70, true),
  (v_caf_id, 'Sharjah Special', 'Special Shakes', 70, true),
  (v_caf_id, 'Mango Choco Chip', 'Special Shakes', 80, true),
  (v_caf_id, 'Cocktail Ajel', 'Special Shakes', 80, true),
  (v_caf_id, 'Alphonsa Smoothie', 'Special Shakes', 80, true),
  (v_caf_id, 'LETHAFI Madness', 'Special Shakes', 80, true),
  (v_caf_id, 'Tender Mango', 'Special Shakes', 80, true),
  (v_caf_id, 'Tender Chikoo', 'Special Shakes', 80, true),
  (v_caf_id, 'Chocolate Sharjah Special', 'Special Shakes', 80, true),
  (v_caf_id, 'Tender Avocado', 'Special Shakes', 80, true),

  -- Ice Cream Shakes
  (v_caf_id, 'Vanilla Ice Cream Shake', 'Ice Cream Shakes', 60, true),
  (v_caf_id, 'Chocolate Ice Cream Shake', 'Ice Cream Shakes', 70, true),
  (v_caf_id, 'Butterscotch Ice Cream Shake', 'Ice Cream Shakes', 70, true),
  (v_caf_id, 'Strawberry Ice Cream Shake', 'Ice Cream Shakes', 70, true),
  (v_caf_id, 'Pistachios Ice Cream Shake', 'Ice Cream Shakes', 70, true),
  (v_caf_id, 'Mango Ice Cream Shake', 'Ice Cream Shakes', 70, true),

  -- Lassi
  (v_caf_id, 'Sweet Lassi', 'Lassi', 35, true),
  (v_caf_id, 'Chocolate Lassi', 'Lassi', 80, true),
  (v_caf_id, 'Strawberry Lassi', 'Lassi', 40, true),
  (v_caf_id, 'Fruit Lassi', 'Lassi', 50, true),
  (v_caf_id, 'Mango Lassi', 'Lassi', 50, true),
  (v_caf_id, 'Dry Fruit Lassi', 'Lassi', 60, true),

  -- Delights
  (v_caf_id, 'Fruit Salad', 'Delights', 80, true),
  (v_caf_id, 'Gud Bud', 'Delights', 80, true),
  (v_caf_id, 'Royal Falooda', 'Delights', 110, true),
  (v_caf_id, 'Dry Fruit Queen', 'Delights', 120, true),
  (v_caf_id, 'Death By Chocolate', 'Delights', 120, true),

  -- Club Sandwich
  (v_caf_id, 'Veg Club Sandwich', 'Club Sandwich', 89, true),
  (v_caf_id, 'Egg Club Sandwich', 'Club Sandwich', 99, true),
  (v_caf_id, 'Chicken Club Sandwich', 'Club Sandwich', 109, true),
  (v_caf_id, 'Fillet Club Sandwich', 'Club Sandwich', 129, true),

  -- Strips
  (v_caf_id, 'Chicken Strips', 'Strips', 70, true),
  (v_caf_id, 'Creamy Strips', 'Strips', 85, true),

  -- Sandwiches
  (v_caf_id, 'Classic Veg Sandwich', 'Sandwiches', 50, true),
  (v_caf_id, 'Grilled Mayo Cheese Sandwich', 'Sandwiches', 50, true),
  (v_caf_id, 'Egg Sandwich', 'Sandwiches', 55, true),
  (v_caf_id, 'Sweet Corn Cheese Sandwich', 'Sandwiches', 55, true),
  (v_caf_id, 'Lays Cheese Sandwich', 'Sandwiches', 60, true),
  (v_caf_id, 'Chocolate Cheese Sandwich', 'Sandwiches', 60, true),
  (v_caf_id, 'Paneer Sandwich', 'Sandwiches', 65, true),
  (v_caf_id, 'Chicken Fillet Sandwich', 'Sandwiches', 70, true),
  (v_caf_id, 'Chicken Sandwich', 'Sandwiches', 90, true),

  -- Egg Bites
  (v_caf_id, 'Bun Omlet', 'Egg Bites', 30, true),
  (v_caf_id, 'Bread Omlet', 'Egg Bites', 40, true),
  (v_caf_id, 'Egg Bites', 'Egg Bites', 45, true),

  -- Loaded Fries
  (v_caf_id, 'Classic Loaded Fries', 'Loaded Fries', 130, true),
  (v_caf_id, 'Cheesy Loaded Fries', 'Loaded Fries', 140, true),

  -- Rolls
  (v_caf_id, 'Egg Roll', 'Rolls', 50, true),
  (v_caf_id, 'Veg Roll', 'Rolls', 55, true),
  (v_caf_id, 'Paneer Roll', 'Rolls', 70, true),
  (v_caf_id, 'Egg with Chicken Roll', 'Rolls', 80, true),

  -- Burgers
  (v_caf_id, 'Classic Veg Burger', 'Burgers', 50, true),
  (v_caf_id, 'Egg Burger', 'Burgers', 55, true),
  (v_caf_id, 'Paneer Burger', 'Burgers', 60, true),
  (v_caf_id, 'Veg Nuggets Burger', 'Burgers', 60, true),
  (v_caf_id, 'Classic Chicken Burger', 'Burgers', 60, true),
  (v_caf_id, 'Crunchy Chicken Burger', 'Burgers', 75, true),
  (v_caf_id, 'Chicken Cheese Burger', 'Burgers', 80, true),
  (v_caf_id, 'Chicken with Egg Burger', 'Burgers', 80, true),
  (v_caf_id, 'Zinger Chicken Burger', 'Burgers', 80, true),
  (v_caf_id, 'Zinger Stacker', 'Burgers', 120, true),

  -- Buns
  (v_caf_id, 'Mayo Bun', 'Buns', 25, true),
  (v_caf_id, 'Lays Bun', 'Buns', 30, true),

  -- Wraps
  (v_caf_id, 'Veggies Wrap', 'Wraps', 80, true),
  (v_caf_id, 'Crispy Chicken Wrap', 'Wraps', 90, true),
  (v_caf_id, 'Green Grill Wrap', 'Wraps', 110, true),
  (v_caf_id, 'Fillet Wrap', 'Wraps', 110, true),
  (v_caf_id, 'Tandoori Wrap', 'Wraps', 130, true),
  (v_caf_id, 'Lethafi Wrap', 'Wraps', 149, true),

  -- Quick Bites
  (v_caf_id, 'French Fries', 'Quick Bites', 70, true),
  (v_caf_id, 'Peri Peri Fries', 'Quick Bites', 80, true),
  (v_caf_id, 'Veg Nuggets', 'Quick Bites', 70, true),
  (v_caf_id, 'Chicken Nuggets', 'Quick Bites', 80, true),
  (v_caf_id, 'Finger Chicken', 'Quick Bites', 80, true),
  (v_caf_id, 'Onion Rings', 'Quick Bites', 90, true),

  -- Maggie's
  (v_caf_id, 'Masala Maggie', 'Maggies', 35, true),
  (v_caf_id, 'Sweet Corn Maggie', 'Maggies', 40, true),
  (v_caf_id, 'Egg Maggie', 'Maggies', 40, true),
  (v_caf_id, 'Chicken Maggie', 'Maggies', 50, true);

  -- Queue entry for the new restaurant
  insert into cafeteria_queues (cafeteria_id, queue_count, avg_wait_mins)
  values (v_caf_id, 0, 10);
end $$;
