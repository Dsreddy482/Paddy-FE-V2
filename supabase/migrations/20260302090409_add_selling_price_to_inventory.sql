/*
  # Add Selling Price to Inventory System

  1. Changes
    - Add `selling_price_per_unit` column to `inventory_items` table
      - This stores the standard selling price that will be used when allocating to users
    - Add `is_investment` boolean to `inventory_stock_transactions` table
      - Distinguishes between investment transactions (buying stock) and collection transactions (selling to users)
    
  2. Notes
    - Investment amount is tracked per transaction when adding stock
    - Selling price is set at inventory item level for consistency
    - Each removal transaction can still override the price if needed
*/

-- Add selling price to inventory items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'selling_price_per_unit'
  ) THEN
    ALTER TABLE inventory_items 
    ADD COLUMN selling_price_per_unit decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add is_investment flag to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'is_investment'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN is_investment boolean DEFAULT false;
  END IF;
END $$;

-- Update existing addition transactions to be marked as investments
UPDATE inventory_stock_transactions 
SET is_investment = true 
WHERE transaction_type = 'addition' AND is_investment IS NULL;
