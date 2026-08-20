-- Add The Punjabi House menu items
WITH cafe AS (
  SELECT id FROM cafeterias WHERE vendor_email = 'punjabihouse@yoters.com'
)

INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_veg, is_available)
SELECT cafe.id, items.name, items.description, items.price, items.category, items.is_veg, true
FROM cafe
CROSS JOIN (
  VALUES
    -- STARTERS - VEG TANDOOR
    ('Starters', 'Paneer Tikka', 'Paneer tikka tandoori', 179, true),
    ('Starters', 'Peri Peri Paneer Tikka', 'Peri peri paneer tikka', 189, true),
    ('Starters', 'Afghani Malai Paneer Tikka', 'Afghani malai paneer tikka', 195, true),
    ('Starters', 'Achari Paneer Tikka', 'Achari paneer tikka', 189, true),
    ('Starters', 'Lemon Paneer Tikka', 'Lemon paneer tikka', 195, true),
    ('Starters', 'Lemon Chaap Tikka', 'Lemon chaap tikka', 189, true),
    ('Starters', 'Peri Peri Chaap Tikka', 'Peri peri chaap tikka', 189, true),
    ('Starters', 'Delhi Soya Chaap Tikka', 'Delhi soya chaap tikka', 179, true),
    ('Starters', 'Afghani Malai Soya Chaap', 'Afghani malai soya chaap', 199, true),
    ('Starters', 'Tandoori Mushroom', 'Tandoori mushroom', 179, true),
    ('Starters', 'Hara Bhara Kebab', 'Hara bhara kebab', 169, true),
    ('Starters', 'Dahi Kebab', 'Dahi kebab', 189, true),
    ('Starters', 'Veg Tandoori Platter', 'Veg tandoori platter', 499, true),

    -- STARTERS - PANEER
    ('Starters', 'Paneer Chilly', 'Paneer chilly', 189, true),
    ('Starters', 'Paneer Manchurian', 'Paneer manchurian', 189, true),
    ('Starters', 'Dragon Paneer', 'Dragon paneer', 199, true),
    ('Starters', 'Paneer Majestic', 'Paneer majestic', 199, true),
    ('Starters', 'Paneer Pepper Dry', 'Paneer pepper dry', 189, true),
    ('Starters', 'Paneer 65', 'Paneer 65', 189, true),
    ('Starters', 'Lemon Paneer', 'Lemon paneer', 199, true),

    -- STARTERS - VEG CHINESE
    ('Starters', 'Honey Chilly Potato', 'Honey chilly potato', 179, true),
    ('Starters', 'Crispy Corn', 'Crispy corn', 159, true),
    ('Starters', 'Veg Manchurian', 'Veg manchurian', 159, true),
    ('Starters', 'Crispy Chilli Potato', 'Crispy chilli potato', 169, true),
    ('Starters', 'Gobi Manchurian / Chilly', 'Gobi manchurian or chilly', 149, true),
    ('Starters', 'Gobi Pepper Dry / 65', 'Gobi pepper dry or 65', 149, true),
    ('Starters', 'Mushroom Manchurian / Chilly', 'Mushroom manchurian or chilly', 159, true),
    ('Starters', 'Mushroom Pepper Dry', 'Mushroom pepper dry', 169, true),
    ('Starters', 'Babycorn Manchurian / Chilly', 'Babycorn manchurian or chilly', 169, true),
    ('Starters', 'Babycorn Pepper Dry', 'Babycorn pepper dry', 169, true),

    -- APPETIZERS & SOUPS - VEG
    ('Soups', 'Masala Papad', 'Masala papad', 49, true),
    ('Soups', 'Roasted / Fry Papad', 'Roasted or fried papad', 23, true),
    ('Soups', 'Dal Bhadi Raita', 'Dal bhadi raita', 99, true),
    ('Soups', 'Veg / Boondi Raita', 'Veg or boondi raita', 79, true),
    ('Soups', 'Green Salad', 'Green salad', 69, true),
    ('Soups', 'Veg Manchow Soup', 'Veg manchow soup', 79, true),
    ('Soups', 'Veg Hot & Sour Soup', 'Veg hot and sour soup', 79, true),
    ('Soups', 'Tomato Soup', 'Tomato soup', 89, true),
    ('Soups', 'Lemon Coriander Soup', 'Lemon coriander soup', 89, true),

    -- STARTERS - CHICKEN TANDOORI
    ('Starters', 'Chicken Tikka', 'Chicken tikka', 179, false),
    ('Starters', 'Boneless Chicken Tikka', 'Boneless chicken tikka', 189, false),
    ('Starters', 'Afghani Malai Chicken Tikka', 'Afghani malai chicken tikka', 195, false),
    ('Starters', 'Garlic Chicken Tikka', 'Garlic chicken tikka', 189, false),
    ('Starters', 'Lemon Chicken Tikka', 'Lemon chicken tikka', 195, false),
    ('Starters', 'Chicken Sheek Kebab', 'Chicken sheek kebab', 179, false),
    ('Starters', 'Chicken Reshmi Kebab', 'Chicken reshmi kebab', 249, false),
    ('Starters', 'Chicken Tangri Kebab', 'Chicken tangri kebab', 279, false),
    ('Starters', 'Patiala Tangri Kebab', 'Patiala tangri kebab', 319, false),
    ('Starters', 'Afghani Tangri Kebab', 'Afghani tangri kebab', 309, false),
    ('Starters', 'Chicken Tandoori Platter', 'Chicken tandoori platter', 659, false),

    -- STARTERS - CHICKEN CHINESE
    ('Starters', 'Drums of Heaven', 'Drums of heaven', 169, false),
    ('Starters', 'Lollipop (Chilly/Manchurian)', 'Lollipop chilly or manchurian', 189, false),
    ('Starters', 'Chicken Kali Mirch Andhra Special', 'Chicken kali mirch andhra special', 209, false),
    ('Starters', 'Dragon Chicken', 'Dragon chicken', 209, false),
    ('Starters', 'Chicken Majestic', 'Chicken majestic', 209, false),
    ('Starters', 'Chilly Chicken', 'Chilly chicken', 189, false),
    ('Starters', 'Chicken Manchurian', 'Chicken manchurian', 189, false),
    ('Starters', 'Lemon Chicken', 'Lemon chicken', 199, false),
    ('Starters', 'Chicken 65', 'Chicken 65', 189, false),
    ('Starters', 'Chicken Pepper Dry', 'Chicken pepper dry', 189, false),
    ('Starters', 'Garlic Chicken', 'Garlic chicken', 189, false),
    ('Starters', 'Chicken Fry Kebab', 'Chicken fry kebab', 199, false),

    -- STARTERS - EGG DELIGHTS
    ('Starters', 'Egg Chilly', 'Egg chilly', 159, false),
    ('Starters', 'Egg Manchurian', 'Egg manchurian', 159, false),
    ('Starters', 'Egg Pepper Dry', 'Egg pepper dry', 169, false),
    ('Starters', 'Egg 65', 'Egg 65', 169, false),
    ('Starters', 'Egg Bhurji', 'Egg bhurji', 89, false),
    ('Starters', 'Masala Omelette', 'Masala omelette', 59, false),
    ('Starters', 'Plain Omelette', 'Plain omelette', 49, false),
    ('Starters', 'Masala Boiled Eggs', 'Masala boiled eggs', 49, false),
    ('Starters', 'Boiled Eggs', 'Boiled eggs', 39, false),

    -- SOUPS - CHICKEN
    ('Soups', 'Chicken Manchow Soup', 'Chicken manchow soup', 99, false),
    ('Soups', 'Chicken Hot & Sour Soup', 'Chicken hot and sour soup', 99, false),
    ('Soups', 'Chicken Clear Soup', 'Chicken clear soup', 89, false),
    ('Soups', 'Lemon Coriander Chicken Soup', 'Lemon coriander chicken soup', 109, false),

    -- VEG MAINCOURSE - PANEER
    ('Mains', 'Paneer Tikka Masala', 'Paneer tikka masala', 209, true),
    ('Mains', 'Paneer Takatak', 'Paneer takatak', 209, true),
    ('Mains', 'Rara Paneer', 'Rara paneer', 209, true),
    ('Mains', 'Paneer Tawa', 'Paneer tawa', 209, true),
    ('Mains', 'Amritsari Paneer Masala', 'Amritsari paneer masala', 189, true),
    ('Mains', 'Kadhai Paneer', 'Kadhai paneer', 189, true),
    ('Mains', 'Shahi Paneer', 'Shahi paneer', 189, true),
    ('Mains', 'Punjabi Paneer', 'Punjabi paneer', 189, true),
    ('Mains', 'Paneer Kolhapuri', 'Paneer kolhapuri', 189, true),
    ('Mains', 'Palak Paneer', 'Palak paneer', 189, true),
    ('Mains', 'Paneer Do Pyaza', 'Paneer do pyaza', 199, true),
    ('Mains', 'Matar Paneer', 'Matar paneer', 179, true),
    ('Mains', 'Paneer Pasanda', 'Paneer pasanda', 219, true),
    ('Mains', 'Kaju Paneer', 'Kaju paneer', 229, true),
    ('Mains', 'Paneer Bhurji', 'Paneer bhurji', 209, true),

    -- VEG MAINCOURSE - KOFTA & DAL
    ('Mains', 'Malai Paneer Kofta', 'Malai paneer kofta', 209, true),
    ('Mains', 'Veg Kofta', 'Veg kofta', 189, true),
    ('Mains', 'Paneer Kofta', 'Paneer kofta', 209, true),
    ('Mains', 'Dal Makhani', 'Dal makhani', 179, true),
    ('Mains', 'Special Dhaba Style Dal', 'Special dhaba style dal', 139, true),
    ('Mains', 'Ghee Dal Tadka', 'Ghee dal tadka', 129, true),
    ('Mains', 'Dal Fry', 'Dal fry', 129, true),

    -- VEG MAINCOURSE - NAWABI
    ('Mains', 'Mushroom Tikka Masala', 'Mushroom tikka masala', 109, true),
    ('Mains', 'Mushroom Masala', 'Mushroom masala', 179, true),
    ('Mains', 'Matar Mushroom', 'Matar mushroom', 179, true),
    ('Mains', 'Kadhai Mushroom', 'Kadhai mushroom', 189, true),
    ('Mains', 'Chaap Tikka Masala', 'Chaap tikka masala', 199, true),
    ('Mains', 'Tawa Chaap', 'Tawa chaap', 199, true),
    ('Mains', 'Chaap Butter Masala', 'Chaap butter masala', 199, true),
    ('Mains', 'Punjabi Chaap Masala', 'Punjabi chaap masala', 189, true),
    ('Mains', 'Shahi Chaap Masala', 'Shahi chaap masala', 229, true),
    ('Mains', 'Kali Masala', 'Kali masala', 229, true),
    ('Mains', 'Kaju Kolhapuri', 'Kaju kolhapuri', 239, true),

    -- VEG MAINCOURSE - PUNJABI
    ('Mains', 'Veg Jalfrezi', 'Veg jalfrezi', 179, true),
    ('Mains', 'Rajma Masala', 'Rajma masala', 169, true),
    ('Mains', 'Punjabi Kadhi Pakoda', 'Punjabi kadhi pakoda', 169, true),
    ('Mains', 'Chana Masala', 'Chana masala', 149, true),
    ('Mains', 'Chana Paneer Masala', 'Chana paneer masala', 189, true),
    ('Mains', 'Aloo Gobi Matar', 'Aloo gobi matar', 149, true),
    ('Mains', 'Aloo Jeera - Dry', 'Aloo jeera dry', 129, true),
    ('Mains', 'Bhindi Fry - Dry', 'Bhindi fry dry', 149, true),
    ('Mains', 'Bhindi Masala', 'Bhindi masala', 159, true),

    -- VEG DELIGHTS
    ('Mains', 'Mix Veg', 'Mix veg', 159, true),
    ('Mains', 'Veg Kadhai', 'Veg kadhai', 169, true),
    ('Mains', 'Veg Kolhapuri', 'Veg kolhapuri', 169, true),
    ('Mains', 'Veg Nizami Handi', 'Veg nizami handi', 189, true),
    ('Mains', 'Tawa Veg', 'Tawa veg', 189, true),
    ('Mains', 'Green Peas Masala', 'Green peas masala', 169, true),

    -- NON-VEG MAINCOURSE - CHICKEN DELIGHTS
    ('Mains', 'Signature Delhi Butter Chicken', 'Signature Delhi butter chicken', 219, false),
    ('Mains', 'Tandoori Chicken Masala', 'Tandoori chicken masala', 239, false),
    ('Mains', 'Chicken Tikka Masala', 'Chicken tikka masala', 219, false),
    ('Mains', 'Punjabi Chicken Masala', 'Punjabi chicken masala', 219, false),
    ('Mains', 'Pind''s Fav- Rara Chicken', 'Pind''s fav rara chicken', 239, false),
    ('Mains', 'Special Chicken Takatak', 'Special chicken takatak', 239, false),
    ('Mains', 'Dhaba Style Kadhai Chicken', 'Dhaba style kadhai chicken', 209, false),
    ('Mains', 'Chicken Kolhapuri', 'Chicken kolhapuri', 219, false),
    ('Mains', 'Mughlai Chicken Labaddar', 'Mughlai chicken labaddar', 229, false),
    ('Mains', 'Patiala Dalak Chicken', 'Patiala dalak chicken', 209, false),
    ('Mains', 'Afghani Malai Chicken', 'Afghani malai chicken', 239, false),
    ('Mains', 'Nawabi Chicken Korma', 'Nawabi chicken korma', 239, false),
    ('Mains', 'Dhaba Chicken Masala', 'Dhaba chicken masala', 189, false),
    ('Mains', 'Chicken Kali Mirch', 'Chicken kali mirch', 219, false),
    ('Mains', 'Homestyle Chicken Curry', 'Homestyle chicken curry', 169, false),

    -- NON-VEG MAINCOURSE - EGG DELIGHTS
    ('Mains', 'Egg Punjabi Masala', 'Egg punjabi masala', 159, false),
    ('Mains', 'Egg Kadhai', 'Egg kadhai', 159, false),
    ('Mains', 'Egg Kolhapuri', 'Egg kolhapuri', 169, false),
    ('Mains', 'Dhaba Egg Masala', 'Dhaba egg masala', 149, false),
    ('Mains', 'Egg Curry', 'Egg curry', 129, false),
    ('Mains', 'Egg Bhurji', 'Egg bhurji', 89, false),
    ('Mains', 'Masala Omelette', 'Masala omelette', 59, false),
    ('Mains', 'Plain Omelette', 'Plain omelette', 49, false),

    -- NON-VEG MAINCOURSE - MUTTON DELIGHTS
    ('Mains', 'Mutton Rogan Josh', 'Mutton rogan josh', 329, false),
    ('Mains', 'Rara Mutton', 'Rara mutton', 339, false),
    ('Mains', 'Mutton Kadhai', 'Mutton kadhai', 319, false),
    ('Mains', 'Mutton Masala', 'Mutton masala', 309, false),

    -- BREADS - WHOLE WHEAT
    ('Breads', 'Plain Phulka', 'Plain phulka', 15, true),
    ('Breads', 'Butter Phulka', 'Butter phulka', 18, true),
    ('Breads', 'Desi Ghee Phulka', 'Desi ghee phulka', 20, true),
    ('Breads', 'Plain Tandoori Roti', 'Plain tandoori roti', 20, true),
    ('Breads', 'Butter Tandoori Roti', 'Butter tandoori roti', 25, true),
    ('Breads', 'Bread Basket', 'Bread basket', 199, true),

    -- BREADS - NAAN
    ('Breads', 'Cheese Garlic Naan', 'Cheese garlic naan', 75, true),
    ('Breads', 'Cheese Naan', 'Cheese naan', 70, true),
    ('Breads', 'Garlic Naan', 'Garlic naan', 50, true),
    ('Breads', 'Butter Naan', 'Butter naan', 40, true),
    ('Breads', 'Plain Naan', 'Plain naan', 35, true),
    ('Breads', 'Aloo Pyaaz Chur Naan', 'Aloo pyaaz chur naan', 79, true),
    ('Breads', 'Paneer Chur Chur Naan', 'Paneer chur chur naan', 99, true),

    -- BREADS - PARATHA & KULCHE
    ('Breads', 'Garlic Laccha Paratha', 'Garlic laccha paratha', 48, true),
    ('Breads', 'SPL Laccha Paratha', 'SPL laccha paratha', 40, true),
    ('Breads', 'Kerela Paratha', 'Kerela paratha', 23, true),
    ('Breads', 'Tawa Paratha', 'Tawa paratha', 25, true),
    ('Breads', 'Ajwain Paratha', 'Ajwain paratha', 30, true),
    ('Breads', 'Cheese Kulcha', 'Cheese kulcha', 60, true),
    ('Breads', 'Butter Kulcha', 'Butter kulcha', 40, true),
    ('Breads', 'Plain Kulcha', 'Plain kulcha', 35, true),
    ('Breads', 'Paneer Kulcha', 'Paneer kulcha', 89, true),
    ('Breads', 'Aloo Pyaaz Kulcha', 'Aloo pyaaz kulcha', 69, true),
    ('Breads', 'Amritsari Kulcha', 'Amritsari kulcha', 79, true),
    ('Breads', 'Rumali Roti', 'Rumali roti', 35, true),

    -- BREADS - STUFFED PARATHA
    ('Breads', 'Aloo Paratha', 'Aloo paratha', 65, true),
    ('Breads', 'Pyaaz Paratha', 'Pyaaz paratha', 75, true),
    ('Breads', 'Aloo Pyaaz Paratha', 'Aloo pyaaz paratha', 75, true),
    ('Breads', 'Paneer Paratha', 'Paneer paratha', 89, true),
    ('Breads', 'Gobi Paratha', 'Gobi paratha', 89, true),

    -- RICE & NOODLES - NOODLES
    ('Rice', 'Veg Chowmein', 'Veg chowmein', 119, true),
    ('Rice', 'Veg Noodles', 'Veg noodles', 119, true),
    ('Rice', 'Manchurian Noodles', 'Manchurian noodles', 129, true),
    ('Rice', 'Gobi Noodles', 'Gobi noodles', 129, true),
    ('Rice', 'Pepper Noodles', 'Pepper noodles', 139, true),
    ('Rice', 'Mushroom Noodles', 'Mushroom noodles', 129, true),
    ('Rice', 'Chilli Garlic Noodles', 'Chilli garlic noodles', 129, true),
    ('Rice', 'Chicken Chowmein', 'Chicken chowmein', 145, false),
    ('Rice', 'Chicken Noodles', 'Chicken noodles', 145, false),
    ('Rice', 'Schezwan Chicken Noodles', 'Schezwan chicken noodles', 149, false),
    ('Rice', 'Chilli Garlic Chicken Noodles', 'Chilli garlic chicken noodles', 149, false),
    ('Rice', 'Egg Noodles', 'Egg noodles', 129, false),
    ('Rice', 'Egg Schezwan Noodles', 'Egg schezwan noodles', 139, false),
    ('Rice', 'Egg Chilli Garlic Noodles', 'Egg chilli garlic noodles', 139, false),

    -- RICE & NOODLES - FRIED RICE
    ('Rice', 'Veg Fried Rice', 'Veg fried rice', 109, true),
    ('Rice', 'Manchurian Fried Rice', 'Manchurian fried rice', 129, true),
    ('Rice', 'Gobi Fried Rice', 'Gobi fried rice', 129, true),
    ('Rice', 'Paneer Fried Rice', 'Paneer fried rice', 139, true),
    ('Rice', 'Mushroom Fried Rice', 'Mushroom fried rice', 129, true),
    ('Rice', 'Chilli Garlic Rice', 'Chilli garlic rice', 129, true),
    ('Rice', 'Chicken Fried Rice', 'Chicken fried rice', 135, false),
    ('Rice', 'Schezwan Chicken Fried Rice', 'Schezwan chicken fried rice', 149, false),
    ('Rice', 'Chilli Garlic Chicken Rice', 'Chilli garlic chicken rice', 149, false),
    ('Rice', 'Egg Fried Rice', 'Egg fried rice', 129, false),
    ('Rice', 'Egg Schezwan Fried Rice', 'Egg schezwan fried rice', 139, false),
    ('Rice', 'Egg Chilli Garlic Fried Rice', 'Egg chilli garlic fried rice', 139, false),

    -- RICE & NOODLES - RICE VARIETY
    ('Rice', 'Steam Rice', 'Steam rice', 89, true),
    ('Rice', 'Jeera Rice', 'Jeera rice', 109, true),
    ('Rice', 'Ghee Rice', 'Ghee rice', 119, true),
    ('Rice', 'Dal Khichdi', 'Dal khichdi', 119, true),
    ('Rice', 'Palak Khichdi', 'Palak khichdi', 129, true),
    ('Rice', 'Masala Rice', 'Masala rice', 129, true),
    ('Rice', 'Paneer Pulav', 'Paneer pulav', 159, true),
    ('Rice', 'Veg Pulav', 'Veg pulav', 139, true),
    ('Rice', 'Green Peas Pulav', 'Green peas pulav', 139, true),
    ('Rice', 'Curd Rice', 'Curd rice', 99, true),

    -- BIRYANI - NON VEG
    ('Biryani', 'Hyderabadi Chicken Dum Biryani', 'Hyderabadi chicken dum biryani', 169, false),
    ('Biryani', 'Kolkata Chicken Dum Biryani', 'Kolkata chicken dum biryani', 179, false),
    ('Biryani', 'Butter Chicken Boneless Biryani', 'Butter chicken boneless biryani', 219, false),
    ('Biryani', 'Chicken Tikka Biryani', 'Chicken tikka biryani', 219, false),
    ('Biryani', 'Mughlai Chicken Biryani', 'Mughlai chicken biryani', 219, false),
    ('Biryani', 'Grill Chicken Biryani', 'Grill chicken biryani', 209, false),
    ('Biryani', 'Alfham Chicken + Biryani Rice', 'Alfham chicken plus biryani rice', 209, false),
    ('Biryani', 'Tandoori Chicken Biryani', 'Tandoori chicken biryani', 209, false),
    ('Biryani', 'Khuska - Kebab (4pcs)', 'Khuska kebab 4 pieces', 249, false),
    ('Biryani', 'Biryani Rice (Khuska)', 'Biryani rice khuska', 109, false),
    ('Biryani', 'Mutton Dum Biryani', 'Mutton dum biryani', 259, false),
    ('Biryani', 'Kolkata Mutton Biryani', 'Kolkata mutton biryani', 279, false),
    ('Biryani', 'Egg Biryani', 'Egg biryani', 159, false),

    -- BIRYANI - VEG
    ('Biryani', 'Paneer Tikka Biryani', 'Paneer tikka biryani', 169, true),
    ('Biryani', 'Paneer Biryani', 'Paneer biryani', 179, true),
    ('Biryani', 'Mushroom Biryani', 'Mushroom biryani', 169, true),
    ('Biryani', 'Veg Dum Biryani', 'Veg dum biryani', 149, true),
    ('Biryani', 'TPH Special Veg Biryani', 'TPH special veg biryani', 159, true),
    ('Biryani', 'Chaap Tikka Biryani', 'Chaap tikka biryani', 169, true),

    -- THALI & COMBOS - VEG THALI
    ('Combos', 'SPL Veg Punjabi Thali', 'SPL veg punjabi thali', 189, true),
    ('Combos', 'Premium Veg Thali', 'Premium veg thali', 149, true),
    ('Combos', 'Cholay/Rajma Thali', 'Cholay or rajma thali', 139, true),
    ('Combos', 'Gobi Manchurian Thali', 'Gobi manchurian thali', 149, true),

    -- THALI & COMBOS - NON-VEG THALI
    ('Combos', 'SPL Non-Veg Punjabi Thali', 'SPL non-veg punjabi thali', 229, false),
    ('Combos', 'Butter Chicken Thali', 'Butter chicken thali', 199, false),
    ('Combos', 'Chicken Masala Thali', 'Chicken masala thali', 179, false),
    ('Combos', 'Grill/Alfham/Tandoori Chicken Meal', 'Grill alfham or tandoori chicken meal', 239, false),

    -- THALI & COMBOS - PUNJABI MANIA
    ('Combos', 'Amritsari Aloo Kulcha Combo', 'Amritsari aloo kulcha combo', 159, true),
    ('Combos', 'Paneer Chur-Chur Naan Combo', 'Paneer chur chur naan combo', 179, true),
    ('Combos', 'Aloo Pyaaz Chur-Chur Naan', 'Aloo pyaaz chur chur naan', 159, true),
    ('Combos', 'Poori Sabi Combo', 'Poori sabi combo', 149, false),
    ('Combos', 'Delhi Cholay Bhature', 'Delhi cholay bhature', 129, true),
    ('Combos', 'Chicken Biryani Family Pack (Serves 3-4)', 'Chicken biryani family pack', 699, false),
    ('Combos', 'Chicken Biryani Couple Pack (Serves 2)', 'Chicken biryani couple pack', 359, false),

    -- RICE BOWLS & COMBOS - SIGNATURE COMBOS
    ('Combos', 'Chicken Tikka Masala Combo', 'Chicken tikka masala combo', 169, false),
    ('Combos', 'Butter Chicken Combo', 'Butter chicken combo', 169, false),
    ('Combos', 'Chilly Chicken Combo', 'Chilly chicken combo', 169, false),
    ('Combos', 'Veg Curry Combo', 'Veg curry combo', 149, true),
    ('Combos', 'Kadhai Paneer Combo', 'Kadhai paneer combo', 159, true),
    ('Combos', 'Gobi Manchurian Combo', 'Gobi manchurian combo', 149, true),

    -- RICE BOWLS & COMBOS - TPH RICE BOWLS
    ('Combos', 'Butter Chicken Rice Bowl', 'Butter chicken rice bowl', 169, false),
    ('Combos', 'Chicken Curry Rice Bowl', 'Chicken curry rice bowl', 159, false),
    ('Combos', 'Egg Curry Rice Bowl', 'Egg curry rice bowl', 139, false),
    ('Combos', 'Kadhai Paneer Rice Bowl', 'Kadhai paneer rice bowl', 159, true),
    ('Combos', 'Cholay Rice Bowl', 'Cholay rice bowl', 149, true),
    ('Combos', 'Kadi Pakoda Rice Bowl', 'Kadi pakoda rice bowl', 149, true),
    ('Combos', 'Dal Makhani Rice Bowl', 'Dal makhani rice bowl', 159, true),
    ('Combos', 'Dal Tadka Rice Bowl', 'Dal tadka rice bowl', 129, true),
    ('Combos', 'Rajma Chawal Bowl', 'Rajma chawal bowl', 149, true),

    -- RICE BOWLS & COMBOS - TPH CHINESE BOWLS
    ('Combos', 'Gobi / Veg Manchurian Bowl', 'Gobi or veg manchurian bowl', 149, true),
    ('Combos', 'Paneer Chilly Bowl', 'Paneer chilly bowl', 169, true),
    ('Combos', 'Chilly Chicken Bowl', 'Chilly chicken bowl', 169, false),

    -- SHAKES
    ('Beverages', 'Mango Milkshake', 'Mango milkshake', 99, true),
    ('Beverages', 'Banana Milkshake', 'Banana milkshake', 89, true),
    ('Beverages', 'Strawberry Milkshake', 'Strawberry milkshake', 99, true),
    ('Beverages', 'Rose Milkshake', 'Rose milkshake', 109, true),
    ('Beverages', 'Badam Milkshake', 'Badam milkshake', 109, true),
    ('Beverages', 'Pista Milkshake', 'Pista milkshake', 119, true),
    ('Beverages', 'Dry Fruit Milkshake', 'Dry fruit milkshake', 149, true),
    ('Beverages', 'Blueberry Milkshake', 'Blueberry milkshake', 129, true),

    -- SIGNATURE SHAKES
    ('Beverages', 'Cold Coffee', 'Cold coffee', 139, true),
    ('Beverages', 'Pina Colada', 'Pina colada', 139, true),
    ('Beverages', 'Fruit Punch', 'Fruit punch', 139, true),
    ('Beverages', 'Nutella', 'Nutella shake', 149, true),
    ('Beverages', 'Oreo', 'Oreo shake', 139, true),

    -- JUICES
    ('Beverages', 'Pineapple', 'Pineapple juice', 79, true),
    ('Beverages', 'Watermelon', 'Watermelon juice', 69, true),
    ('Beverages', 'Lime Soda', 'Lime soda', 49, true),
    ('Beverages', 'Mint Lime', 'Mint lime', 59, true),
    ('Beverages', 'Orange', 'Orange juice', 79, true),
    ('Beverages', 'Mosambi', 'Mosambi juice', 79, true),

    -- FRIES
    ('Sides', 'Salted Fries', 'Salted fries', 69, true),
    ('Sides', 'Peri Peri Fries', 'Peri peri fries', 79, true),
    ('Sides', 'Cheesy Fries', 'Cheesy fries', 109, true),
    ('Sides', 'Paneer Tikka Loaded Fries', 'Paneer tikka loaded fries', 159, true),
    ('Sides', 'Chicken Tikka Loaded Fries', 'Chicken tikka loaded fries', 169, false),

    -- PASTA
    ('Pasta', 'White Sauce Pasta', 'White sauce pasta', 179, true),
    ('Pasta', 'Red Sauce Pasta', 'Red sauce pasta', 179, true),
    ('Pasta', 'Pink Sauce Pasta', 'Pink sauce pasta', 189, true),
    ('Pasta', 'Creamy Mushroom Pasta', 'Creamy mushroom pasta', 199, true),
    ('Pasta', 'Chicken White Sauce Pasta', 'Chicken white sauce pasta', 199, false),
    ('Pasta', 'Chicken Red Sauce Pasta', 'Chicken red sauce pasta', 199, false),

    -- MOJITOS
    ('Beverages', 'Virgin Mojito', 'Virgin mojito', 99, true),
    ('Beverages', 'Blue Sea Lime', 'Blue sea lime', 99, true),
    ('Beverages', 'Fresh Lime', 'Fresh lime', 49, true),

    -- ICE CREAM
    ('Desserts', 'Butter Scotch', 'Butter scotch ice cream', 69, true),
    ('Desserts', 'Strawberry', 'Strawberry ice cream', 69, true),
    ('Desserts', 'Chocolate', 'Chocolate ice cream', 79, true),
    ('Desserts', 'Vanilla', 'Vanilla ice cream', 69, true),
    ('Desserts', 'Black Currant', 'Black currant ice cream', 89, true),
    ('Desserts', 'Mango', 'Mango ice cream', 79, true),

    -- REFRESHMENTS
    ('Desserts', 'Punjabi Sweet Lassi', 'Punjabi sweet lassi', 69, true),
    ('Desserts', 'Butter Milk', 'Butter milk', 59, true),
    ('Desserts', 'Gulab Jamun', 'Gulab jamun', 39, true),
    ('Desserts', 'Choco Lava Cake', 'Choco lava cake', 79, true),
    ('Desserts', 'Walnut Brownie', 'Walnut brownie', 79, true),
    ('Desserts', 'Matka Rabdi', 'Matka rabdi', 79, true),
    ('Desserts', 'Rasmalai', 'Rasmalai', 69, true)
) AS items(category, name, description, price, is_veg)
ON CONFLICT DO NOTHING;
