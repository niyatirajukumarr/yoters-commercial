-- Clear all orders (for reset/testing)
-- This deletes all orders and related data while respecting foreign key constraints

-- Delete from payouts first (references orders table via cafeteria_id)
DELETE FROM payouts;

-- Delete from notifications (references orders table)
DELETE FROM notifications;

-- Delete all orders
DELETE FROM orders;

-- Reset token sequences to 0 (for daily token numbers)
UPDATE token_sequences SET current_token = 0, reset_date = current_date;
