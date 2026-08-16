-- Add The Punjabi House menu items
WITH cafe AS (
  SELECT id FROM cafeterias WHERE vendor_email = 'punjabihouse@yoters.com'
)

INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_veg, is_available, variants)
SELECT cafe.id, items.name, items.description, items.price, items.category, items.is_veg, true, items.variants
FROM cafe
CROSS JOIN (
  VALUES
    -- STARTERS - VEG TANDOOR
    ('Starters', 'Paneer Tikka', 'Paneer tikka tandoori', 179, true, NULL),
    ('Starters', 'Peri Peri Paneer Tikka', 'Peri peri paneer tikka', 189, true, NULL),
    ('Starters', 'Afghani Malai Paneer Tikka', 'Afghani malai paneer tikka', 195, true, NULL),
    ('Starters', 'Achari Paneer Tikka', 'Achari paneer tikka', 189, true, NULL),
    ('Starters', 'Lemon Paneer Tikka', 'Lemon paneer tikka', 195, true, NULL),
    ('Starters', 'Lemon Chaap Tikka', 'Lemon chaap tikka', 189, true, NULL),
    ('Starters', 'Peri Peri Chaap Tikka', 'Peri peri chaap tikka', 189, true, NULL),
    ('Starters', 'Delhi Soya Chaap Tikka', 'Delhi soya chaap tikka', 179, true, NULL),
    ('Starters', 'Afghani Malai Soya Chaap', 'Afghani malai soya chaap', 199, true, NULL),
    ('Starters', 'Tandoori Mushroom', 'Tandoori mushroom', 179, true, NULL),
    ('Starters', 'Hara Bhara Kebab', 'Hara bhara kebab', 169, true, NULL),
    ('Starters', 'Dahi Kebab', 'Dahi kebab', 189, true, NULL),
    ('Starters', 'Veg Tandoori Platter', 'Veg tandoori platter', 499, true, NULL),

    -- STARTERS - PANEER
    ('Starters', 'Paneer Chilly', 'Paneer chilly', 189, true, NULL),
    ('Starters', 'Paneer Manchurian', 'Paneer manchurian', 189, true, NULL),
    ('Starters', 'Dragon Paneer', 'Dragon paneer', 199, true, NULL),
    ('Starters', 'Paneer Majestic', 'Paneer majestic', 199, true, NULL),
    ('Starters', 'Paneer Pepper Dry', 'Paneer pepper dry', 189, true, NULL),
    ('Starters', 'Paneer 65', 'Paneer 65', 189, true, NULL),
    ('Starters', 'Lemon Paneer', 'Lemon paneer', 199, true, NULL),

    -- STARTERS - VEG CHINESE
    ('Starters', 'Honey Chilly Potato', 'Honey chilly potato', 179, true, NULL),
    ('Starters', 'Crispy Corn', 'Crispy corn', 159, true, NULL),
    ('Starters', 'Veg Manchurian', 'Veg manchurian', 159, true, NULL),
    ('Starters', 'Crispy Chilli Potato', 'Crispy chilli potato', 169, true, NULL),
    ('Starters', 'Gobi Manchurian / Chilly', 'Gobi manchurian or chilly', 149, true, NULL),
    ('Starters', 'Gobi Pepper Dry / 65', 'Gobi pepper dry or 65', 149, true, NULL),
    ('Starters', 'Mushroom Manchurian / Chilly', 'Mushroom manchurian or chilly', 159, true, NULL),
    ('Starters', 'Mushroom Pepper Dry', 'Mushroom pepper dry', 169, true, NULL),
    ('Starters', 'Babycorn Manchurian / Chilly', 'Babycorn manchurian or chilly', 169, true, NULL),
    ('Starters', 'Babycorn Pepper Dry', 'Babycorn pepper dry', 169, true, NULL),

    -- APPETIZERS & SOUPS - VEG
    ('Soups', 'Masala Papad', 'Masala papad', 49, true, NULL),
    ('Soups', 'Roasted / Fry Papad', 'Roasted or fried papad', 23, true, NULL),
    ('Soups', 'Dal Bhadi Raita', 'Dal bhadi raita', 99, true, NULL),
    ('Soups', 'Veg / Boondi Raita', 'Veg or boondi raita', 79, true, NULL),
    ('Soups', 'Green Salad', 'Green salad', 69, true, NULL),
    ('Soups', 'Veg Manchow Soup', 'Veg manchow soup', 79, true, NULL),
    ('Soups', 'Veg Hot & Sour Soup', 'Veg hot and sour soup', 79, true, NULL),
    ('Soups', 'Tomato Soup', 'Tomato soup', 89, true, NULL),
    ('Soups', 'Lemon Coriander Soup', 'Lemon coriander soup', 89, true, NULL),

    -- STARTERS - CHICKEN TANDOORI
    ('Starters', 'Chicken Tikka', 'Chicken tikka', 179, false, NULL),
    ('Starters', 'Boneless Chicken Tikka', 'Boneless chicken tikka', 189, false, NULL),
    ('Starters', 'Afghani Malai Chicken Tikka', 'Afghani malai chicken tikka', 195, false, NULL),
    ('Starters', 'Garlic Chicken Tikka', 'Garlic chicken tikka', 189, false, NULL),
    ('Starters', 'Lemon Chicken Tikka', 'Lemon chicken tikka', 195, false, NULL),
    ('Starters', 'Chicken Sheek Kebab', 'Chicken sheek kebab', 179, false, NULL),
    ('Starters', 'Chicken Reshmi Kebab', 'Chicken reshmi kebab', 249, false, NULL),
    ('Starters', 'Chicken Tangri Kebab', 'Chicken tangri kebab', 279, false, NULL),
    ('Starters', 'Patiala Tangri Kebab', 'Patiala tangri kebab', 319, false, NULL),
    ('Starters', 'Afghani Tangri Kebab', 'Afghani tangri kebab', 309, false, NULL),
    ('Starters', 'Chicken Tandoori Platter', 'Chicken tandoori platter', 659, false, NULL),

    -- STARTERS - CHICKEN CHINESE
    ('Starters', 'Drums of Heaven', 'Drums of heaven', 169, false, NULL),
    ('Starters', 'Lollipop (Chilly/Manchurian)', 'Lollipop chilly or manchurian', 189, false, NULL),
    ('Starters', 'Chicken Kali Mirch Andhra Special', 'Chicken kali mirch andhra special', 209, false, NULL),
    ('Starters', 'Dragon Chicken', 'Dragon chicken', 209, false, NULL),
    ('Starters', 'Chicken Majestic', 'Chicken majestic', 209, false, NULL),
    ('Starters', 'Chilly Chicken', 'Chilly chicken', 189, false, NULL),
    ('Starters', 'Chicken Manchurian', 'Chicken manchurian', 189, false, NULL),
    ('Starters', 'Lemon Chicken', 'Lemon chicken', 199, false, NULL),
    ('Starters', 'Chicken 65', 'Chicken 65', 189, false, NULL),
    ('Starters', 'Chicken Pepper Dry', 'Chicken pepper dry', 189, false, NULL),
    ('Starters', 'Garlic Chicken', 'Garlic chicken', 189, false, NULL),
    ('Starters', 'Chicken Fry Kebab', 'Chicken fry kebab', 199, false, NULL),

    -- STARTERS - EGG DELIGHTS
    ('Starters', 'Egg Chilly', 'Egg chilly', 159, false, NULL),
    ('Starters', 'Egg Manchurian', 'Egg manchurian', 159, false, NULL),
    ('Starters', 'Egg Pepper Dry', 'Egg pepper dry', 169, false, NULL),
    ('Starters', 'Egg 65', 'Egg 65', 169, false, NULL),
    ('Starters', 'Egg Bhurji', 'Egg bhurji', 89, false, NULL),
    ('Starters', 'Masala Omelette', 'Masala omelette', 59, false, NULL),
    ('Starters', 'Plain Omelette', 'Plain omelette', 49, false, NULL),
    ('Starters', 'Masala Boiled Eggs', 'Masala boiled eggs', 49, false, NULL),
    ('Starters', 'Boiled Eggs', 'Boiled eggs', 39, false, NULL),

    -- SOUPS - CHICKEN
    ('Soups', 'Chicken Manchow Soup', 'Chicken manchow soup', 99, false, NULL),
    ('Soups', 'Chicken Hot & Sour Soup', 'Chicken hot and sour soup', 99, false, NULL),
    ('Soups', 'Chicken Clear Soup', 'Chicken clear soup', 89, false, NULL),
    ('Soups', 'Lemon Coriander Chicken Soup', 'Lemon coriander chicken soup', 109, false, NULL),

    -- VEG MAINCOURSE - PANEER
    ('Mains', 'Paneer Tikka Masala', 'Paneer tikka masala', 209, true, NULL),
    ('Mains', 'Paneer Takatak', 'Paneer takatak', 209, true, NULL),
    ('Mains', 'Rara Paneer', 'Rara paneer', 209, true, NULL),
    ('Mains', 'Paneer Tawa', 'Paneer tawa', 209, true, NULL),
    ('Mains', 'Amritsari Paneer Masala', 'Amritsari paneer masala', 189, true, NULL),
    ('Mains', 'Kadhai Paneer', 'Kadhai paneer', 189, true, NULL),
    ('Mains', 'Shahi Paneer', 'Shahi paneer', 189, true, NULL),
    ('Mains', 'Punjabi Paneer', 'Punjabi paneer', 189, true, NULL),
    ('Mains', 'Paneer Kolhapuri', 'Paneer kolhapuri', 189, true, NULL),
    ('Mains', 'Palak Paneer', 'Palak paneer', 189, true, NULL),
    ('Mains', 'Paneer Do Pyaza', 'Paneer do pyaza', 199, true, NULL),
    ('Mains', 'Matar Paneer', 'Matar paneer', 179, true, NULL),
    ('Mains', 'Paneer Pasanda', 'Paneer pasanda', 219, true, NULL),
    ('Mains', 'Kaju Paneer', 'Kaju paneer', 229, true, NULL),
    ('Mains', 'Paneer Bhurji', 'Paneer bhurji', 209, true, NULL),

    -- VEG MAINCOURSE - KOFTA & DAL
    ('Mains', 'Malai Paneer Kofta', 'Malai paneer kofta', 209, true, NULL),
    ('Mains', 'Veg Kofta', 'Veg kofta', 189, true, NULL),
    ('Mains', 'Paneer Kofta', 'Paneer kofta', 209, true, NULL),
    ('Mains', 'Dal Makhani', 'Dal makhani', 179, true, NULL),
    ('Mains', 'Special Dhaba Style Dal', 'Special dhaba style dal', 139, true, NULL),
    ('Mains', 'Ghee Dal Tadka', 'Ghee dal tadka', 129, true, NULL),
    ('Mains', 'Dal Fry', 'Dal fry', 129, true, NULL),

    -- VEG MAINCOURSE - NAWABI
    ('Mains', 'Mushroom Tikka Masala', 'Mushroom tikka masala', 109, true, NULL),
    ('Mains', 'Mushroom Masala', 'Mushroom masala', 179, true, NULL),
    ('Mains', 'Matar Mushroom', 'Matar mushroom', 179, true, NULL),
    ('Mains', 'Kadhai Mushroom', 'Kadhai mushroom', 189, true, NULL),
    ('Mains', 'Chaap Tikka Masala', 'Chaap tikka masala', 199, true, NULL),
    ('Mains', 'Tawa Chaap', 'Tawa chaap', 199, true, NULL),
    ('Mains', 'Chaap Butter Masala', 'Chaap butter masala', 199, true, NULL),
    ('Mains', 'Punjabi Chaap Masala', 'Punjabi chaap masala', 189, true, NULL),
    ('Mains', 'Shahi Chaap Masala', 'Shahi chaap masala', 229, true, NULL),
    ('Mains', 'Kali Masala', 'Kali masala', 229, true, NULL),
    ('Mains', 'Kaju Kolhapuri', 'Kaju kolhapuri', 239, true, NULL),

    -- VEG MAINCOURSE - PUNJABI
    ('Mains', 'Veg Jalfrezi', 'Veg jalfrezi', 179, true, NULL),
    ('Mains', 'Rajma Masala', 'Rajma masala', 169, true, NULL),
    ('Mains', 'Punjabi Kadhi Pakoda', 'Punjabi kadhi pakoda', 169, true, NULL),
    ('Mains', 'Chana Masala', 'Chana masala', 149, true, NULL),
    ('Mains', 'Chana Paneer Masala', 'Chana paneer masala', 189, true, NULL),
    ('Mains', 'Aloo Gobi Matar', 'Aloo gobi matar', 149, true, NULL),
    ('Mains', 'Aloo Jeera - Dry', 'Aloo jeera dry', 129, true, NULL),
    ('Mains', 'Bhindi Fry - Dry', 'Bhindi fry dry', 149, true, NULL),
    ('Mains', 'Bhindi Masala', 'Bhindi masala', 159, true, NULL),

    -- VEG DELIGHTS
    ('Mains', 'Mix Veg', 'Mix veg', 159, true, NULL),
    ('Mains', 'Veg Kadhai', 'Veg kadhai', 169, true, NULL),
    ('Mains', 'Veg Kolhapuri', 'Veg kolhapuri', 169, true, NULL),
    ('Mains', 'Veg Nizami Handi', 'Veg nizami handi', 189, true, NULL),
    ('Mains', 'Tawa Veg', 'Tawa veg', 189, true, NULL),
    ('Mains', 'Green Peas Masala', 'Green peas masala', 169, true, NULL),

    -- NON-VEG MAINCOURSE - CHICKEN DELIGHTS
    ('Mains', 'Signature Delhi Butter Chicken', 'Signature Delhi butter chicken', 219, false, NULL),
    ('Mains', 'Tandoori Chicken Masala', 'Tandoori chicken masala', 239, false, NULL),
    ('Mains', 'Chicken Tikka Masala', 'Chicken tikka masala', 219, false, NULL),
    ('Mains', 'Punjabi Chicken Masala', 'Punjabi chicken masala', 219, false, NULL),
    ('Mains', 'Pind''s Fav- Rara Chicken', 'Pind''s fav rara chicken', 239, false, NULL),
    ('Mains', 'Special Chicken Takatak', 'Special chicken takatak', 239, false, NULL),
    ('Mains', 'Dhaba Style Kadhai Chicken', 'Dhaba style kadhai chicken', 209, false, NULL),
    ('Mains', 'Chicken Kolhapuri', 'Chicken kolhapuri', 219, false, NULL),
    ('Mains', 'Mughlai Chicken Labaddar', 'Mughlai chicken labaddar', 229, false, NULL),
    ('Mains', 'Patiala Dalak Chicken', 'Patiala dalak chicken', 209, false, NULL),
    ('Mains', 'Afghani Malai Chicken', 'Afghani malai chicken', 239, false, NULL),
    ('Mains', 'Nawabi Chicken Korma', 'Nawabi chicken korma', 239, false, NULL),
    ('Mains', 'Dhaba Chicken Masala', 'Dhaba chicken masala', 189, false, NULL),
    ('Mains', 'Chicken Kali Mirch', 'Chicken kali mirch', 219, false, NULL),
    ('Mains', 'Homestyle Chicken Curry', 'Homestyle chicken curry', 169, false, NULL),

    -- NON-VEG MAINCOURSE - EGG DELIGHTS
    ('Mains', 'Egg Punjabi Masala', 'Egg punjabi masala', 159, false, NULL),
    ('Mains', 'Egg Kadhai', 'Egg kadhai', 159, false, NULL),
    ('Mains', 'Egg Kolhapuri', 'Egg kolhapuri', 169, false, NULL),
    ('Mains', 'Dhaba Egg Masala', 'Dhaba egg masala', 149, false, NULL),
    ('Mains', 'Egg Curry', 'Egg curry', 129, false, NULL),
    ('Mains', 'Egg Bhurji', 'Egg bhurji', 89, false, NULL),
    ('Mains', 'Masala Omelette', 'Masala omelette', 59, false, NULL),
    ('Mains', 'Plain Omelette', 'Plain omelette', 49, false, NULL),

    -- NON-VEG MAINCOURSE - MUTTON DELIGHTS
    ('Mains', 'Mutton Rogan Josh', 'Mutton rogan josh', 329, false, NULL),
    ('Mains', 'Rara Mutton', 'Rara mutton', 339, false, NULL),
    ('Mains', 'Mutton Kadhai', 'Mutton kadhai', 319, false, NULL),
    ('Mains', 'Mutton Masala', 'Mutton masala', 309, false, NULL),

    -- BREADS - WHOLE WHEAT
    ('Breads', 'Plain Phulka', 'Plain phulka', 15, true, NULL),
    ('Breads', 'Butter Phulka', 'Butter phulka', 18, true, NULL),
    ('Breads', 'Desi Ghee Phulka', 'Desi ghee phulka', 20, true, NULL),
    ('Breads', 'Plain Tandoori Roti', 'Plain tandoori roti', 20, true, NULL),
    ('Breads', 'Butter Tandoori Roti', 'Butter tandoori roti', 25, true, NULL),
    ('Breads', 'Bread Basket', 'Bread basket', 199, true, NULL),

    -- BREADS - NAAN
    ('Breads', 'Cheese Garlic Naan', 'Cheese garlic naan', 75, true, NULL),
    ('Breads', 'Cheese Naan', 'Cheese naan', 70, true, NULL),
    ('Breads', 'Garlic Naan', 'Garlic naan', 50, true, NULL),
    ('Breads', 'Butter Naan', 'Butter naan', 40, true, NULL),
    ('Breads', 'Plain Naan', 'Plain naan', 35, true, NULL),
    ('Breads', 'Aloo Pyaaz Chur Naan', 'Aloo pyaaz chur naan', 79, true, NULL),
    ('Breads', 'Paneer Chur Chur Naan', 'Paneer chur chur naan', 99, true, NULL),

    -- BREADS - PARATHA & KULCHE
    ('Breads', 'Garlic Laccha Paratha', 'Garlic laccha paratha', 48, true, NULL),
    ('Breads', 'SPL Laccha Paratha', 'SPL laccha paratha', 40, true, NULL),
    ('Breads', 'Kerela Paratha', 'Kerela paratha', 23, true, NULL),
    ('Breads', 'Tawa Paratha', 'Tawa paratha', 25, true, NULL),
    ('Breads', 'Ajwain Paratha', 'Ajwain paratha', 30, true, NULL),
    ('Breads', 'Cheese Kulcha', 'Cheese kulcha', 60, true, NULL),
    ('Breads', 'Butter Kulcha', 'Butter kulcha', 40, true, NULL),
    ('Breads', 'Plain Kulcha', 'Plain kulcha', 35, true, NULL),
    ('Breads', 'Paneer Kulcha', 'Paneer kulcha', 89, true, NULL),
    ('Breads', 'Aloo Pyaaz Kulcha', 'Aloo pyaaz kulcha', 69, true, NULL),
    ('Breads', 'Amritsari Kulcha', 'Amritsari kulcha', 79, true, NULL),
    ('Breads', 'Rumali Roti', 'Rumali roti', 35, true, NULL),

    -- BREADS - STUFFED PARATHA
    ('Breads', 'Aloo Paratha', 'Aloo paratha', 65, true, NULL),
    ('Breads', 'Pyaaz Paratha', 'Pyaaz paratha', 75, true, NULL),
    ('Breads', 'Aloo Pyaaz Paratha', 'Aloo pyaaz paratha', 75, true, NULL),
    ('Breads', 'Paneer Paratha', 'Paneer paratha', 89, true, NULL),
    ('Breads', 'Gobi Paratha', 'Gobi paratha', 89, true, NULL),

    -- RICE & NOODLES - NOODLES
    ('Rice', 'Veg Chowmein', 'Veg chowmein', 119, true, NULL),
    ('Rice', 'Veg Noodles', 'Veg noodles', 119, true, NULL),
    ('Rice', 'Manchurian Noodles', 'Manchurian noodles', 129, true, NULL),
    ('Rice', 'Gobi Noodles', 'Gobi noodles', 129, true, NULL),
    ('Rice', 'Pepper Noodles', 'Pepper noodles', 139, true, NULL),
    ('Rice', 'Mushroom Noodles', 'Mushroom noodles', 129, true, NULL),
    ('Rice', 'Chilli Garlic Noodles', 'Chilli garlic noodles', 129, true, NULL),
    ('Rice', 'Chicken Chowmein', 'Chicken chowmein', 145, false, NULL),
    ('Rice', 'Chicken Noodles', 'Chicken noodles', 145, false, NULL),
    ('Rice', 'Schezwan Chicken Noodles', 'Schezwan chicken noodles', 149, false, NULL),
    ('Rice', 'Chilli Garlic Chicken Noodles', 'Chilli garlic chicken noodles', 149, false, NULL),
    ('Rice', 'Egg Noodles', 'Egg noodles', 129, false, NULL),
    ('Rice', 'Egg Schezwan Noodles', 'Egg schezwan noodles', 139, false, NULL),
    ('Rice', 'Egg Chilli Garlic Noodles', 'Egg chilli garlic noodles', 139, false, NULL),

    -- RICE & NOODLES - FRIED RICE
    ('Rice', 'Veg Fried Rice', 'Veg fried rice', 109, true, NULL),
    ('Rice', 'Manchurian Fried Rice', 'Manchurian fried rice', 129, true, NULL),
    ('Rice', 'Gobi Fried Rice', 'Gobi fried rice', 129, true, NULL),
    ('Rice', 'Paneer Fried Rice', 'Paneer fried rice', 139, true, NULL),
    ('Rice', 'Mushroom Fried Rice', 'Mushroom fried rice', 129, true, NULL),
    ('Rice', 'Chilli Garlic Rice', 'Chilli garlic rice', 129, true, NULL),
    ('Rice', 'Chicken Fried Rice', 'Chicken fried rice', 135, false, NULL),
    ('Rice', 'Schezwan Chicken Fried Rice', 'Schezwan chicken fried rice', 149, false, NULL),
    ('Rice', 'Chilli Garlic Chicken Rice', 'Chilli garlic chicken rice', 149, false, NULL),
    ('Rice', 'Egg Fried Rice', 'Egg fried rice', 129, false, NULL),
    ('Rice', 'Egg Schezwan Fried Rice', 'Egg schezwan fried rice', 139, false, NULL),
    ('Rice', 'Egg Chilli Garlic Fried Rice', 'Egg chilli garlic fried rice', 139, false, NULL),

    -- RICE & NOODLES - RICE VARIETY
    ('Rice', 'Steam Rice', 'Steam rice', 89, true, NULL),
    ('Rice', 'Jeera Rice', 'Jeera rice', 109, true, NULL),
    ('Rice', 'Ghee Rice', 'Ghee rice', 119, true, NULL),
    ('Rice', 'Dal Khichdi', 'Dal khichdi', 119, true, NULL),
    ('Rice', 'Palak Khichdi', 'Palak khichdi', 129, true, NULL),
    ('Rice', 'Masala Rice', 'Masala rice', 129, true, NULL),
    ('Rice', 'Paneer Pulav', 'Paneer pulav', 159, true, NULL),
    ('Rice', 'Veg Pulav', 'Veg pulav', 139, true, NULL),
    ('Rice', 'Green Peas Pulav', 'Green peas pulav', 139, true, NULL),
    ('Rice', 'Curd Rice', 'Curd rice', 99, true, NULL),

    -- BIRYANI - NON VEG
    ('Biryani', 'Hyderabadi Chicken Dum Biryani', 'Hyderabadi chicken dum biryani', 169, false, NULL),
    ('Biryani', 'Kolkata Chicken Dum Biryani', 'Kolkata chicken dum biryani', 179, false, NULL),
    ('Biryani', 'Butter Chicken Boneless Biryani', 'Butter chicken boneless biryani', 219, false, NULL),
    ('Biryani', 'Chicken Tikka Biryani', 'Chicken tikka biryani', 219, false, NULL),
    ('Biryani', 'Mughlai Chicken Biryani', 'Mughlai chicken biryani', 219, false, NULL),
    ('Biryani', 'Grill Chicken Biryani', 'Grill chicken biryani', 209, false, NULL),
    ('Biryani', 'Alfham Chicken + Biryani Rice', 'Alfham chicken plus biryani rice', 209, false, NULL),
    ('Biryani', 'Tandoori Chicken Biryani', 'Tandoori chicken biryani', 209, false, NULL),
    ('Biryani', 'Khuska - Kebab (4pcs)', 'Khuska kebab 4 pieces', 249, false, NULL),
    ('Biryani', 'Biryani Rice (Khuska)', 'Biryani rice khuska', 109, false, NULL),
    ('Biryani', 'Mutton Dum Biryani', 'Mutton dum biryani', 259, false, NULL),
    ('Biryani', 'Kolkata Mutton Biryani', 'Kolkata mutton biryani', 279, false, NULL),
    ('Biryani', 'Egg Biryani', 'Egg biryani', 159, false, NULL),

    -- BIRYANI - VEG
    ('Biryani', 'Paneer Tikka Biryani', 'Paneer tikka biryani', 169, true, NULL),
    ('Biryani', 'Paneer Biryani', 'Paneer biryani', 179, true, NULL),
    ('Biryani', 'Mushroom Biryani', 'Mushroom biryani', 169, true, NULL),
    ('Biryani', 'Veg Dum Biryani', 'Veg dum biryani', 149, true, NULL),
    ('Biryani', 'TPH Special Veg Biryani', 'TPH special veg biryani', 159, true, NULL),
    ('Biryani', 'Chaap Tikka Biryani', 'Chaap tikka biryani', 169, true, NULL),

    -- THALI & COMBOS - VEG THALI
    ('Combos', 'SPL Veg Punjabi Thali', 'SPL veg punjabi thali', 189, true, NULL),
    ('Combos', 'Premium Veg Thali', 'Premium veg thali', 149, true, NULL),
    ('Combos', 'Cholay/Rajma Thali', 'Cholay or rajma thali', 139, true, NULL),
    ('Combos', 'Gobi Manchurian Thali', 'Gobi manchurian thali', 149, true, NULL),

    -- THALI & COMBOS - NON-VEG THALI
    ('Combos', 'SPL Non-Veg Punjabi Thali', 'SPL non-veg punjabi thali', 229, false, NULL),
    ('Combos', 'Butter Chicken Thali', 'Butter chicken thali', 199, false, NULL),
    ('Combos', 'Chicken Masala Thali', 'Chicken masala thali', 179, false, NULL),
    ('Combos', 'Grill/Alfham/Tandoori Chicken Meal', 'Grill alfham or tandoori chicken meal', 239, false, NULL),

    -- THALI & COMBOS - PUNJABI MANIA
    ('Combos', 'Amritsari Aloo Kulcha Combo', 'Amritsari aloo kulcha combo', 159, true, NULL),
    ('Combos', 'Paneer Chur-Chur Naan Combo', 'Paneer chur chur naan combo', 179, true, NULL),
    ('Combos', 'Aloo Pyaaz Chur-Chur Naan', 'Aloo pyaaz chur chur naan', 159, true, NULL),
    ('Combos', 'Poori Sabi Combo', 'Poori sabi combo', 149, false, NULL),
    ('Combos', 'Delhi Cholay Bhature', 'Delhi cholay bhature', 129, true, NULL),
    ('Combos', 'Chicken Biryani Family Pack (Serves 3-4)', 'Chicken biryani family pack', 699, false, NULL),
    ('Combos', 'Chicken Biryani Couple Pack (Serves 2)', 'Chicken biryani couple pack', 359, false, NULL),

    -- RICE BOWLS & COMBOS - SIGNATURE COMBOS
    ('Combos', 'Chicken Tikka Masala Combo', 'Chicken tikka masala combo', 169, false, NULL),
    ('Combos', 'Butter Chicken Combo', 'Butter chicken combo', 169, false, NULL),
    ('Combos', 'Chilly Chicken Combo', 'Chilly chicken combo', 169, false, NULL),
    ('Combos', 'Veg Curry Combo', 'Veg curry combo', 149, true, NULL),
    ('Combos', 'Kadhai Paneer Combo', 'Kadhai paneer combo', 159, true, NULL),
    ('Combos', 'Gobi Manchurian Combo', 'Gobi manchurian combo', 149, true, NULL),

    -- RICE BOWLS & COMBOS - TPH RICE BOWLS
    ('Combos', 'Butter Chicken Rice Bowl', 'Butter chicken rice bowl', 169, false, NULL),
    ('Combos', 'Chicken Curry Rice Bowl', 'Chicken curry rice bowl', 159, false, NULL),
    ('Combos', 'Egg Curry Rice Bowl', 'Egg curry rice bowl', 139, false, NULL),
    ('Combos', 'Kadhai Paneer Rice Bowl', 'Kadhai paneer rice bowl', 159, true, NULL),
    ('Combos', 'Cholay Rice Bowl', 'Cholay rice bowl', 149, true, NULL),
    ('Combos', 'Kadi Pakoda Rice Bowl', 'Kadi pakoda rice bowl', 149, true, NULL),
    ('Combos', 'Dal Makhani Rice Bowl', 'Dal makhani rice bowl', 159, true, NULL),
    ('Combos', 'Dal Tadka Rice Bowl', 'Dal tadka rice bowl', 129, true, NULL),
    ('Combos', 'Rajma Chawal Bowl', 'Rajma chawal bowl', 149, true, NULL),

    -- RICE BOWLS & COMBOS - TPH CHINESE BOWLS
    ('Combos', 'Gobi / Veg Manchurian Bowl', 'Gobi or veg manchurian bowl', 149, true, NULL),
    ('Combos', 'Paneer Chilly Bowl', 'Paneer chilly bowl', 169, true, NULL),
    ('Combos', 'Chilly Chicken Bowl', 'Chilly chicken bowl', 169, false, NULL),

    -- SHAKES
    ('Beverages', 'Mango Milkshake', 'Mango milkshake', 99, true, NULL),
    ('Beverages', 'Banana Milkshake', 'Banana milkshake', 89, true, NULL),
    ('Beverages', 'Strawberry Milkshake', 'Strawberry milkshake', 99, true, NULL),
    ('Beverages', 'Rose Milkshake', 'Rose milkshake', 109, true, NULL),
    ('Beverages', 'Badam Milkshake', 'Badam milkshake', 109, true, NULL),
    ('Beverages', 'Pista Milkshake', 'Pista milkshake', 119, true, NULL),
    ('Beverages', 'Dry Fruit Milkshake', 'Dry fruit milkshake', 149, true, NULL),
    ('Beverages', 'Blueberry Milkshake', 'Blueberry milkshake', 129, true, NULL),

    -- SIGNATURE SHAKES
    ('Beverages', 'Cold Coffee', 'Cold coffee', 139, true, NULL),
    ('Beverages', 'Pina Colada', 'Pina colada', 139, true, NULL),
    ('Beverages', 'Fruit Punch', 'Fruit punch', 139, true, NULL),
    ('Beverages', 'Nutella', 'Nutella shake', 149, true, NULL),
    ('Beverages', 'Oreo', 'Oreo shake', 139, true, NULL),

    -- JUICES
    ('Beverages', 'Pineapple', 'Pineapple juice', 79, true, NULL),
    ('Beverages', 'Watermelon', 'Watermelon juice', 69, true, NULL),
    ('Beverages', 'Lime Soda', 'Lime soda', 49, true, NULL),
    ('Beverages', 'Mint Lime', 'Mint lime', 59, true, NULL),
    ('Beverages', 'Orange', 'Orange juice', 79, true, NULL),
    ('Beverages', 'Mosambi', 'Mosambi juice', 79, true, NULL),

    -- FRIES
    ('Sides', 'Salted Fries', 'Salted fries', 69, true, NULL),
    ('Sides', 'Peri Peri Fries', 'Peri peri fries', 79, true, NULL),
    ('Sides', 'Cheesy Fries', 'Cheesy fries', 109, true, NULL),
    ('Sides', 'Paneer Tikka Loaded Fries', 'Paneer tikka loaded fries', 159, true, NULL),
    ('Sides', 'Chicken Tikka Loaded Fries', 'Chicken tikka loaded fries', 169, false, NULL),

    -- PASTA
    ('Pasta', 'White Sauce Pasta', 'White sauce pasta', 179, true, NULL),
    ('Pasta', 'Red Sauce Pasta', 'Red sauce pasta', 179, true, NULL),
    ('Pasta', 'Pink Sauce Pasta', 'Pink sauce pasta', 189, true, NULL),
    ('Pasta', 'Creamy Mushroom Pasta', 'Creamy mushroom pasta', 199, true, NULL),
    ('Pasta', 'Chicken White Sauce Pasta', 'Chicken white sauce pasta', 199, false, NULL),
    ('Pasta', 'Chicken Red Sauce Pasta', 'Chicken red sauce pasta', 199, false, NULL),

    -- MOJITOS
    ('Beverages', 'Virgin Mojito', 'Virgin mojito', 99, true, NULL),
    ('Beverages', 'Blue Sea Lime', 'Blue sea lime', 99, true, NULL),
    ('Beverages', 'Fresh Lime', 'Fresh lime', 49, true, NULL),

    -- ICE CREAM
    ('Desserts', 'Butter Scotch', 'Butter scotch ice cream', 69, true, NULL),
    ('Desserts', 'Strawberry', 'Strawberry ice cream', 69, true, NULL),
    ('Desserts', 'Chocolate', 'Chocolate ice cream', 79, true, NULL),
    ('Desserts', 'Vanilla', 'Vanilla ice cream', 69, true, NULL),
    ('Desserts', 'Black Currant', 'Black currant ice cream', 89, true, NULL),
    ('Desserts', 'Mango', 'Mango ice cream', 79, true, NULL),

    -- REFRESHMENTS
    ('Desserts', 'Punjabi Sweet Lassi', 'Punjabi sweet lassi', 69, true, NULL),
    ('Desserts', 'Butter Milk', 'Butter milk', 59, true, NULL),
    ('Desserts', 'Gulab Jamun', 'Gulab jamun', 39, true, NULL),
    ('Desserts', 'Choco Lava Cake', 'Choco lava cake', 79, true, NULL),
    ('Desserts', 'Walnut Brownie', 'Walnut brownie', 79, true, NULL),
    ('Desserts', 'Matka Rabdi', 'Matka rabdi', 79, true, NULL),
    ('Desserts', 'Rasmalai', 'Rasmalai', 69, true, NULL)
) AS items(category, name, description, price, is_veg, variants)
ON CONFLICT DO NOTHING;
