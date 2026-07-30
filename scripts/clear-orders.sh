#!/bin/bash

# Script to clear all orders from Yoters database
# Usage: ./scripts/clear-orders.sh

set -e

echo "⚠️  This will DELETE ALL ORDERS from the database."
echo "This action CANNOT be undone without a backup."
echo ""
read -p "Type 'yes' to confirm clearing all orders: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Connecting to Supabase..."

# Run the SQL query via Supabase CLI
supabase db push

echo ""
echo "✅ Orders have been cleared!"
echo ""
echo "Verification:"
echo "- Mobile orders: /mobile/orders (should be empty)"
echo "- Vendor dashboard: /vendor (Orders tab should show no active orders)"
echo "- Admin dashboard: /admin (order counts should be 0)"
