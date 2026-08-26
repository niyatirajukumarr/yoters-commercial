-- The Punjabi House: item-specific images for veg kulcha/rumali roti items,
-- replacing the shared Breads category placeholder set in
-- 20260830_add_punjabi_house_item_images.sql.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/aloo%20pyaaz%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL2Fsb28gcHlhYXoga3VsY2hhLmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc3NDY0NjQsImV4cCI6NDk0MTM0NjQ2NH0.rUpt6br7acXuRTq8hJwEssEN6o7g0uCwTK9VVNGgNck'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Aloo Pyaaz Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/amritsari%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL2Ftcml0c2FyaSBrdWxjaGEuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NjUzMSwiZXhwIjo0OTQxMzQ2NTMxfQ.O9xM-nOxBM5irhbwETZRTw3il6jAG9Pbtt6x0EMD6kA'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Amritsari Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/butter%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL2J1dHRlciBrdWxjaGEuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NjU3MCwiZXhwIjo0OTQxMzQ2NTcwfQ.XQCZSE0EWW9Hwjm9Q7ZRwlOeLv336W2CFVft40Hv368'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Butter Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/cheese%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL2NoZWVzZSBrdWxjaGEuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NjYwMywiZXhwIjo0OTQxMzQ2NjAzfQ.h1PHvSjqXuiLJ61glGVQ2Pj2j9OOSx1EQBh6OK6rQds'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Cheese Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/paneer%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL3BhbmVlciBrdWxjaGEuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NjYyMSwiZXhwIjo0OTQxMzQ2NjIxfQ.wWZ6hei0GAKLu6GLcYaOpkNmL1Gjn0pKlLMd7eTMY9c'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Paneer Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/plain%20kulcha.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL3BsYWluIGt1bGNoYS5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg3NzQ2NjU5LCJleHAiOjQ5NDEzNDY2NTl9.zx6YQoBNWRpGJqE-5MJhrztxysK1cvQNuAv2M6cxtbg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Plain Kulcha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/bread''s%20and%20paratha''s/kulche/rumali%20roti.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9icmVhZCdzIGFuZCBwYXJhdGhhJ3Mva3VsY2hlL3J1bWFsaSByb3RpLmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc3NDY4MTgsImV4cCI6NDk0MTM0NjgxOH0.oqw--47vN5m-gK-1fjpCvWmfqakxu5nP5JiD2SG04mY'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Breads' AND name = 'Rumali Roti';
