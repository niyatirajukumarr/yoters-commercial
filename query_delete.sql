-- Find and display Niyati's test order
SELECT id, student_name, status, total_amount, created_at FROM orders 
WHERE student_name = 'Niyati' AND status = 'pending_approval' 
ORDER BY created_at DESC LIMIT 1;
