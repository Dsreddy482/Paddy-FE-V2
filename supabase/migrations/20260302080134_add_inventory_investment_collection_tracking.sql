/*
  # Add Investment and Collection Tracking to Inventory

  ## Overview
  Adds columns to track investment amounts and collection amounts for inventory items and transactions.

  ## Changes to `inventory_items` table
  1. New Columns
    - `total_investment` (numeric) - Total amount invested in purchasing this inventory item
    - `total_collected` (numeric) - Total amount collected from users for this inventory item
    - Both default to 0 and must be >= 0

  ## Changes to `inventory_stock_transactions` table
  1. New Columns
    - `amount_per_unit` (numeric) - Price per unit for this transaction (investment or collection)
    - `total_amount` (numeric) - Total amount for this transaction (quantity * amount_per_unit)
    - `collection_from_user_id` (uuid) - Reference to user if this is a collection transaction
    - Both amounts default to 0 and must be >= 0

  ## Important Notes
  - Existing records will have investment/collection amounts set to 0
  - Investment is tracked when inventory is added (addition transactions)
  - Collections are tracked when inventory is removed (removal transactions) with user reference
  - The system will maintain running totals in the inventory_items table
*/

-- Add investment and collection tracking to inventory_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'total_investment'
  ) THEN
    ALTER TABLE inventory_items 
    ADD COLUMN total_investment numeric DEFAULT 0 CHECK (total_investment >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'total_collected'
  ) THEN
    ALTER TABLE inventory_items 
    ADD COLUMN total_collected numeric DEFAULT 0 CHECK (total_collected >= 0);
  END IF;
END $$;

-- Add transaction amount tracking to inventory_stock_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'amount_per_unit'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN amount_per_unit numeric DEFAULT 0 CHECK (amount_per_unit >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN total_amount numeric DEFAULT 0 CHECK (total_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'collection_from_user_id'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN collection_from_user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;