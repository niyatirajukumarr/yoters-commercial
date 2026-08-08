-- Add Bombay Dine menu items
-- Get the cafeteria ID for Bombay Dine
WITH cafe AS (
  SELECT id FROM cafeterias WHERE vendor_email = 'bombaydine@yoters.com'
)

INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_veg, is_available)
SELECT cafe.id, items.name, items.description, items.price, items.category, items.is_veg, true
FROM cafe
CROSS JOIN (
  VALUES
    -- SOUPS (VEG)
    ('Soups', 'Sweet Corn Soup', 'Sweet corn soup', 80, true),
    ('Soups', 'Tomato Soup', 'Tomato soup', 70, true),
    ('Soups', 'Mushroom Soup', 'Mushroom soup', 70, true),
    ('Soups', 'Veg Manchow Soup', 'Veg manchow soup', 80, true),
    ('Soups', 'Veg Hot Sour Soup', 'Veg hot sour soup', 90, true),
    ('Soups', 'Chicken Soup', 'Chicken soup', 100, false),
    ('Soups', 'Chicken Manchurian Soup', 'Chicken manchurian soup', 100, false),
    ('Soups', 'Chicken Hot & Sour Soup', 'Chicken hot and sour soup', 100, false),
    ('Soups', 'Chicken Clear Soup', 'Chicken clear soup', 100, false),

    -- MUGHALAI GRAVY (NON-VEG)
    ('Mughalai Gravy', 'Mutton Kassa', 'Mutton kassa', 260, false),
    ('Mughalai Gravy', 'Mutton Curma', 'Mutton curma', 270, false),
    ('Mughalai Gravy', 'Mutton Stew', 'Mutton stew', 270, false),
    ('Mughalai Gravy', 'Mutton Rezala', 'Mutton rezala', 270, false),
    ('Mughalai Gravy', 'Chicken Kassa', 'Chicken kassa', 200, false),
    ('Mughalai Gravy', 'Chicken Curma', 'Chicken curma', 210, false),
    ('Mughalai Gravy', 'Chicken Chaap', 'Chicken chaap', 210, false),
    ('Mughalai Gravy', 'Chicken Rezala', 'Chicken rezala', 210, false),

    -- INDIAN GRAVY - CHICKEN
    ('Indian Gravy', 'Chicken Hydrabadi H/F', 'Boneless chicken cooked with authenticity of Hyderabad', 150, false),
    ('Indian Gravy', 'Handi Chicken H/F', 'Boneless chicken in authentic Indian spices and gravy', 210, false),
    ('Indian Gravy', 'Chicken Kolhapuri H/F', 'Chicken cooked in Kolhapuri style', 150, false),
    ('Indian Gravy', 'Kadai Chicken H/F', 'Chicken cooked in strong flavours of authentic India', 190, false),
    ('Indian Gravy', 'Chicken Tikka Masala H/F', 'Chicken cooked in authentic Indian spices', 210, false),
    ('Indian Gravy', 'Tandoori Chicken Masala H/F', 'Boneless chicken with tandoori flavour', 220, false),
    ('Indian Gravy', 'Chicken Do Pyaza H/F', 'Chicken cooked with creamy onions and authentic spices', 190, false),
    ('Indian Gravy', 'Chicken Lahori H/F', 'Boneless chicken cooked in Lahori style', 200, false),
    ('Indian Gravy', 'Chicken Bhartha H/F', 'Grated chicken cooked with authentic spices and egg', 200, false),
    ('Indian Gravy', 'Chicken Boganjosh H/F', 'Chicken cooked in special spices with lime flavour', 200, false),
    ('Indian Gravy', 'Chicken Bhuna', 'Boneless chicken with roasted flavour', 200, false),
    ('Indian Gravy', 'Bombay Dine Spl Chicken', 'Special chicken recipe', 230, false),

    -- CHINESE - NON VEG
    ('Chinese', 'Bombay Dine Spl. Sizzler Chicken', 'Boneless chicken with spices and creamy gravy', 200, false),
    ('Chinese', 'Hunnan Chicken', 'Boneless chicken with creamy onions and spices', 190, false),
    ('Chinese', 'Lemon Chicken', 'Chicken with lemon zest and juice flavour', 170, false),
    ('Chinese', 'Chilli Chicken Dry/Gravy H/F', 'Chicken in spicy Chinese gravy', 170, false),
    ('Chinese', 'Chicken Manchurian Dry/Gravy H/F', 'Chicken cooked with ginger garlic and spices', 170, false),
    ('Chinese', 'Chicken 65', 'Classic fried chicken in authentic spices', 170, false),

    -- VEGETARIAN CURRIES
    ('Veg Curry', 'Veg Kabeera H/F', 'Veggie frenzy with thick gravy and nuts', 140, true),
    ('Veg Curry', 'Veg Jaipuri H/F', 'Mixed veggie with authentic Indian spices', 140, true),
    ('Veg Curry', 'Aloo Jeera', 'Classic aloo sabzi with jeera', 120, true),
    ('Veg Curry', 'Aloo Matar', 'Classic aloo staged with fresh green peas', 150, true),
    ('Veg Curry', 'Green Peas Masala', 'Fresh green peas with authentic spices', 150, true),
    ('Veg Curry', 'Veg Kolhapuri H/F', 'Veggie frenzy in Kolhapuri style', 140, true),
    ('Veg Curry', 'Mix Vegetables H/F', 'Classic mixed veggies in authentic spices', 140, true),
    ('Veg Curry', 'Mushroom Masala', 'Mushroom cooked with spices', 140, true),
    ('Veg Curry', 'Mushroom Kadai', 'Mushroom in strong flavours', 140, true),

    -- CHINESE - VEG
    ('Chinese', 'Veg Manchurian Dry/Gravy', 'Classic gobi cabbage mix veg in tangy sauce', 130, true),
    ('Chinese', 'Gobi Manchurian Dry/Gravy', 'Gobi cooked with spices in hot tangy sauce', 130, true),
    ('Chinese', 'Gobi Chilli Dry/Gravy', 'Gobi in spicy Chinese gravy', 130, true),
    ('Chinese', 'Mushroom Chilli Dry/Gravy', 'Mushroom in spicy Chinese gravy', 130, true),
    ('Chinese', 'Babycorn Chilli Dry/Gravy', 'Babycorn in spicy Chinese gravy', 130, true),
    ('Chinese', 'Paneer Chilli Dry/Gravy', 'Paneer in spicy Chinese gravy', 160, true),
    ('Chinese', 'Mushroom 65', 'Mushroom cooked in spices for old school flavour', 140, true),
    ('Chinese', 'Paneer 65', 'Paneer cooked in spices for old school flavour', 170, true),

    -- BIRYANI
    ('Biryani', 'Bombay Dine Special Biryani', 'Authentic Biryani with chicken and boiled egg', 180, false),
    ('Biryani', 'Kolkata Biryani H/F', 'Authentic Basmati rice with chicken and flavours', 160, false),
    ('Biryani', 'Hyrabadi Biryani H/F', 'Authentic Basmati rice in Hyrabadi style', 160, false),
    ('Biryani', 'Chicken Biryani H/F', 'Authentic Basmati rice with chicken', 160, false),
    ('Biryani', 'Egg Biryani', 'Authentic Basmati rice with egg', 130, true),
    ('Biryani', 'Aalu Biryani', 'Authentic Basmati rice with potatoes', 120, true),
    ('Biryani', 'Veg Biryani', 'Authentic Basmati rice with vegetables', 130, true),
    ('Biryani', 'Paneer Biryani', 'Authentic Basmati rice with paneer', 150, true),
    ('Biryani', 'Kaimi Biryani', 'Authentic Basmati rice with tandoori leg pieces', 180, false),

    -- TANDOORI SPECIAL
    ('Tandoori Special', 'Tandoori Chicken H/F', 'Authentic tandoori chicken', 360, false),
    ('Tandoori Special', 'Chicken Tikka Kabab H/F', 'Chicken tikka cooked in tandoor', 170, false),
    ('Tandoori Special', 'Haryali Kabab', 'Haryali flavoured kebab', 170, false),
    ('Tandoori Special', 'Rashmi Kabab H/F', 'Rashmi style kebab', 170, false),
    ('Tandoori Special', 'Kalmi Kabab H/F', 'Kalmi kabab from tandoor', 180, false),
    ('Tandoori Special', 'Tandoori Chicken Kabab H/F', 'Tandoori chicken kabab', 380, false),
    ('Tandoori Special', 'Grill Chicken H/F', 'Grilled chicken', 160, false),
    ('Tandoori Special', 'Paneer Tikka Kabab', 'Paneer tikka from tandoor', 140, true),
    ('Tandoori Special', 'Mushroom Tikka Kabab', 'Mushroom tikka from tandoor', 140, true),
    ('Tandoori Special', 'Baby Corn Tikka Kabab', 'Baby corn tikka from tandoor', 140, true),

    -- RICE
    ('Rice', 'Steam Rice', 'Plain steamed rice', 50, true),
    ('Rice', 'Jeera Rice', 'Soft steam rice with jeera flavour', 90, true),
    ('Rice', 'Ghee Rice', 'Steam rice with ghee', 110, true),
    ('Rice', 'Kashmiri Pulav', 'Authentic Basmati rice with Kashmir flavours', 150, true)
) AS items(category, name, description, price, is_veg)
ON CONFLICT DO NOTHING;
