-- Bombay Dine menu. Also the template for the remaining restaurants, so two
-- conventions matter here:
--
--   stock_quantity is never set. Nobody tracks per-item stock, but the order
--   path still decrements whatever is there and hides the dish at zero
--   (app/student/page.tsx) — a seeded count is a hidden countdown to items
--   vanishing mid-service. Leaving the column out means null, i.e. unlimited.
--
--   Half/Full is Bombay Dine's menu, not a platform feature — only copy the
--   variants column for a restaurant that actually sells portions. Leave it
--   out otherwise and the dish renders with a plain price, as LETHAFI's do.
--   Where it IS used, a portioned dish is ONE row carrying a variants array,
--   not two rows with " - Half" / " - Full" names: the customer menu turns
--   the array into the size buttons and the cart keys each size separately
--   (lib/hooks/useCart.ts), and `price` mirrors the Half price for anything
--   reading price alone.

-- Delete all existing Bombay Dine menu items
DELETE FROM cafeteria_menu
WHERE cafeteria_id = '57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0';

-- ===== BOMBAY DINE UPDATED CATEGORIES =====

-- INDIAN GRAVY - 18 Chicken Dishes with Half/Full variants
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Butter Chicken', 'Tender chicken in creamy tomato gravy', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 180}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Methi Chicken', 'Chicken with fresh fenugreek leaves', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 180}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Dhaniya Chicken', 'Chicken cooked with coriander', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Masala', 'Spiced chicken in aromatic gravy', 110, 'Indian Gravy', true, false, '[{"name": "Half", "price": 110}, {"name": "Full", "price": 180}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Punjabi Chicken', 'Punjabi style chicken', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 130}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Bagdadi', 'Bagdadi style chicken', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kabli Chicken', 'Chicken with chickpeas', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 180}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Do Pyaza', 'Chicken with onions', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 190}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Lajawab', 'Boneless chicken with loads of nuts and creamy gravy', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Hydrabadi', 'Hyderabadi style chicken', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 150}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Handi Chicken', 'Chicken cooked in traditional handi', 130, 'Indian Gravy', true, false, '[{"name": "Half", "price": 130}, {"name": "Full", "price": 210}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Kolhapuri', 'Kolhapuri style chicken', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 150}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kadai Chicken', 'Chicken in cast iron wok', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 190}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Tikka Masala', 'Tandoori chicken in creamy tomato sauce', 140, 'Indian Gravy', true, false, '[{"name": "Half", "price": 140}, {"name": "Full", "price": 220}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Tandoori Chicken Masala', 'Tandoori style chicken masala', 140, 'Indian Gravy', true, false, '[{"name": "Half", "price": 140}, {"name": "Full", "price": 220}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Lahori', 'Lahori style chicken', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Bhartha', 'Chicken with burnt eggplant', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Boganjosh', 'Chicken in tomato and walnut sauce', 120, 'Indian Gravy', true, false, '[{"name": "Half", "price": 120}, {"name": "Full", "price": 200}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Bhuna', 'Chicken cooked dry with spices', 200, 'Indian Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Bombay Dine Spl. Chicken', 'Bombay Dine special chicken preparation', 230, 'Indian Gravy', true, false, NULL);

-- VEG CURRY - Mixed (some Half/Full, some single)
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Aloo Jeera', 'Potato with cumin seeds', 120, 'Veg Curry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Aloo Matar', 'Potatoes and green peas', 150, 'Veg Curry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Green Peas Masala', 'Green peas in aromatic spices', 150, 'Veg Curry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mix Vegetables', 'Mixed vegetables with spices', 90, 'Veg Curry', true, true, '[{"name": "Half", "price": 90}, {"name": "Full", "price": 140}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Kadai', 'Mushroom in cast iron wok', 140, 'Veg Curry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Masala', 'Mushroom cooked with spices', 140, 'Veg Curry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Jaipuri', 'Vegetables in Jaipur style', 90, 'Veg Curry', true, true, '[{"name": "Half", "price": 90}, {"name": "Full", "price": 140}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Kabeera', 'Vegetables with thick gravy and spices', 90, 'Veg Curry', true, true, '[{"name": "Half", "price": 90}, {"name": "Full", "price": 140}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Kolhapuri', 'Vegetables in Kolhapuri style', 90, 'Veg Curry', true, true, '[{"name": "Half", "price": 90}, {"name": "Full", "price": 140}]');

-- TANDOORI SPECIAL - Non-Veg Half/Full variants
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Tandoori Chicken', 'Authentic tandoori chicken', 180, 'Tandoori Special', true, false, '[{"name": "Half", "price": 180}, {"name": "Full", "price": 360}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Tikka Kabab', 'Chicken tikka cooked in tandoor', 100, 'Tandoori Special', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 170}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Haryali Kabab', 'Haryali flavored kabab', 100, 'Tandoori Special', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 170}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Rashmi Kabab', 'Rashmi style kabab', 100, 'Tandoori Special', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 170}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kalmi Kabab', 'Kalmi kabab from tandoor', 100, 'Tandoori Special', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 180}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Tandoori Chicken Kabab', 'Tandoori chicken kabab', 190, 'Tandoori Special', true, false, '[{"name": "Half", "price": 190}, {"name": "Full", "price": 380}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Grill Chicken', 'Grilled chicken', 190, 'Tandoori Special', true, false, '[{"name": "Half", "price": 190}, {"name": "Full", "price": 380}]');

-- ===== KEEPING EXISTING ITEMS (VEG & OTHER CATEGORIES) =====

-- BIRYANI - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Egg Biryani', 'Authentic biryani rice with egg', 130, 'Biryani', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Aalu Biryani', 'Biryani with potatoes', 120, 'Biryani', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Biryani', 'Authentic biryani rice with vegetables', 130, 'Biryani', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer Biryani', 'Biryani with paneer', 150, 'Biryani', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Bombay Dine Spl. Biryani', 'Bombay Dine special biryani with chicken and boiled egg', 180, 'Biryani', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kolkata Biryani', 'Kolkata biryani style', 100, 'Biryani', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 160}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Hyrabadi Biryani', 'Hyderabad style biryani', 100, 'Biryani', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 160}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Biryani', 'Biryani with chicken', 100, 'Biryani', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 160}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kaimi Biryani', 'Royal biryani with traditional spices', 180, 'Biryani', true, false, NULL);

-- CHINESE - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Manchurian Dry', 'Vegetable manchurian dry style', 120, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Manchurian Gravy', 'Vegetable manchurian with gravy', 130, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Gobi Manchurian Dry', 'Cauliflower in spicy sauce', 120, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Gobi Manchurian Gravy', 'Cauliflower in spicy sauce with gravy', 130, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Gobi Chilli Dry', 'Gobi in spicy Chinese gravy - Dry style', 120, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Gobi Chilli Gravy', 'Gobi in spicy Chinese gravy - Gravy style', 130, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Chilli Dry', 'Mushroom in spicy Chinese gravy - Dry', 120, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Chilli Gravy', 'Mushroom in spicy Chinese gravy', 130, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Babycorn Chilli Gravy', 'Babycorn in spicy Chinese gravy', 130, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer Chilli Dry', 'Paneer in spicy Chinese gravy - Dry', 150, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer Chilli Gravy', 'Paneer in spicy Chinese gravy', 160, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom 65', 'Mushroom cooked in spices for old school flavour', 140, 'Chinese', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer 65', 'Paneer cooked in spices for old school flavour', 170, 'Chinese', true, true, NULL);

-- CHINESE - NON-VEG (UPDATED)
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chilli Chicken Dry', 'Chicken in spicy chilli sauce', 100, 'Chinese', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 160}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chilli Chicken Gravy', 'Chicken in chilli gravy', 110, 'Chinese', true, false, '[{"name": "Half", "price": 110}, {"name": "Full", "price": 170}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Manchurian Dry', 'Chicken manchurian dry style', 100, 'Chinese', true, false, '[{"name": "Half", "price": 100}, {"name": "Full", "price": 160}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Manchurian Gravy', 'Chicken manchurian with gravy', 110, 'Chinese', true, false, '[{"name": "Half", "price": 110}, {"name": "Full", "price": 170}]'),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Bombay Dine Spl. Sizzler Chicken', 'Bombay Dine special sizzler with spices and creamy gravy', 200, 'Chinese', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Hunnan Chicken', 'Spiced chicken with creamy onions and spices', 190, 'Chinese', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Lemon Chicken', 'Chicken with lemon zest and juice flavour', 170, 'Chinese', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken 65', 'Classic fried chicken in authentic spices', 170, 'Chinese', true, false, NULL);

-- TANDOORI SPECIAL - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer Tikka Kabab', 'Paneer tikka from tandoor', 140, 'Tandoori Special', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Tikka Kabab', 'Mushroom tikka from tandoor', 140, 'Tandoori Special', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Baby Corn Tikka Kabab', 'Baby corn tikka from tandoor', 140, 'Tandoori Special', true, true, NULL);

-- PEPPER DRY - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Paneer Manchurian Pepper Dry', 'Paneer in spicy pepper dry preparation', 180, 'Pepper Dry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Manchurian Pepper Dry', 'Mushroom in spicy pepper dry preparation', 150, 'Pepper Dry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Baby Corn Manchurian Pepper Dry', 'Baby corn in spicy pepper dry preparation', 150, 'Pepper Dry', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Gobi Manchurian Pepper Dry', 'Gobi in spicy pepper dry preparation', 150, 'Pepper Dry', true, true, NULL);

-- RICE - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Steam Rice', 'Plain steamed rice', 50, 'Rice', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Jeera Rice', 'Soft steamed rice with jeera flavour', 90, 'Rice', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Ghee Rice', 'Steamed rice with ghee', 110, 'Rice', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Kashmiri Pulav', 'Authentic biryani rice with Kashmiri flavours', 150, 'Rice', true, true, NULL);

-- SOUPS - VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Sweet Corn Soup', 'Sweet corn soup', 80, 'Soups', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Tomato Soup', 'Tomato soup', 70, 'Soups', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mushroom Soup', 'Mushroom soup', 70, 'Soups', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Manchow Soup', 'Veg manchow soup', 80, 'Soups', true, true, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Veg Hot Sour Soup', 'Veg hot sour soup', 90, 'Soups', true, true, NULL);

-- SOUPS - NON-VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Soup', 'Chicken soup', 100, 'Soups', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Manchurian Soup', 'Chicken manchurian soup', 100, 'Soups', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Hot & Sour Soup', 'Chicken hot and sour soup', 100, 'Soups', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Clear Soup', 'Chicken clear soup', 100, 'Soups', true, false, NULL);

-- MUGHALAI GRAVY - NON-VEG
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mutton Kassa', 'Mutton kassa', 260, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mutton Curma', 'Mutton curma', 270, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mutton Stew', 'Mutton stew', 270, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Mutton Rezala', 'Mutton rezala', 270, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Kassa', 'Chicken kassa', 200, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Curma', 'Chicken curma', 210, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Chaap', 'Chicken chaap', 210, 'Mughalai Gravy', true, false, NULL),
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Chicken Rezala', 'Chicken rezala', 210, 'Mughalai Gravy', true, false, NULL);

-- TEST ITEM (for load testing)
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available, is_veg, variants)
VALUES
  ('57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0', 'Test Item', 'Test item - ignore', 1, 'test-ignore', true, false, NULL);
