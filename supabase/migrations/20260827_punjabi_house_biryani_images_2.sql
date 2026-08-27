-- The Punjabi House: item-specific images for the remaining two veg biryani
-- dishes not covered by 20260826_punjabi_house_veg_biryani_images.sql
-- (Mushroom, Paneer Mughlai, Paneer Tikka, TPH Special Veg) — completes all
-- 6 veg biryani dishes.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/chaap%20tikka%20biryani.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL2NoYWFwIHRpa2thIGJpcnlhbmkuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzg0NzE4OSwiZXhwIjo0OTQxNDQ3MTg5fQ.jBy0tjD0j69jni07aEcD1lQRehULFKcB76Xqe5Zi3Rc'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Chaap Tikka Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/veg%20dum%20biryani.jpg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL3ZlZyBkdW0gYmlyeWFuaS5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg3ODQ3MjA4LCJleHAiOjQ5NDE0NDcyMDh9.Kn5ygcM0GjrUNrhSYfP7LKZybpYKjn0jkQq2alPDZbc'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Veg Dum Biryani';
