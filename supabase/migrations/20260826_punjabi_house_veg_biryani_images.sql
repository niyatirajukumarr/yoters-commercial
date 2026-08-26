-- The Punjabi House: item-specific images for veg biryani dishes, replacing
-- the shared category placeholder set in 20260830_add_punjabi_house_item_images.sql.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/Mushroom%20biryani?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL011c2hyb29tIGJpcnlhbmkiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg3NzQ0OTU4LCJleHAiOjQ5NDEzNDQ5NTh9.pp17-p-ijGCx7ULxvrF_btW9HOwTMOER4RRIREPDE1k'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Mushroom Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/Paneer%20mughlai?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL1BhbmVlciBtdWdobGFpIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NDk4MSwiZXhwIjo0OTQxMzQ0OTgxfQ.eM7w0U0vHQkXolQAsx-6F6iXdsZwxt8gaiHB_rBOMRw'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Paneer Mughlai Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/Paneer%20tikka%20biryani?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL1BhbmVlciB0aWtrYSBiaXJ5YW5pIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Nzc0NDk5NiwiZXhwIjo0OTQxMzQ0OTk2fQ.rTGSgpY96seQhhjm1ZWiI7c8k4i7wdhnWtsCBxSIUaw'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Paneer Tikka Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Punjabi%20house/veg/biryani/TPH%20Special%20veg?token=eyJraWQiOiIxNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQdW5qYWJpIGhvdXNlL3ZlZy9iaXJ5YW5pL1RQSCBTcGVjaWFsIHZlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc3NDUwMTEsImV4cCI6NDk0MTM0NTAxMX0.JC9rOtWFMGHsb2CVWpZ1d8J1glWNvWxO2NEpuV1S3xw'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'TPH Special Veg Biryani';
