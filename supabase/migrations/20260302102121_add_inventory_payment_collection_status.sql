/*
  # Add Payment Collection Status to Inventory Transactions

  ## Overview
  This migration adds payment collection tracking to inventory stock transactions.
  When inventory is allocated/removed, it creates a pending collection record.
  Payment can be marked as collected later.

  ## Changes to `inventory_stock_transactions` table
  1. New Columns
    - `payment_status` (text) - Status of payment collection: 'pending', 'partial', 'collected', 'not_applicable'
    - `amount_collected` (numeric) - Amount actually collected (can be less than total_amount)
    - `payment_date` (timestamptz) - When payment was collected
    - `payment_notes` (text) - Notes about payment collection

  ## Business Rules
  - For 'addition' transactions: payment_status = 'not_applicable' (we're buying, not collecting)
  - For 'removal' transactions: payment_status defaults to 'pending' (need to collect from user)
  - When payment is received: update payment_status to 'collected' and set payment_date
  - amount_collected can be partial (less than total_amount)

  ## Security
  - RLS policies already exist for inventory_stock_transactions table
  - Only authenticated users can update payment status
*/

-- Add payment tracking columns to inventory_stock_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN payment_status text DEFAULT 'not_applicable' 
    CHECK (payment_status IN ('pending', 'partial', 'collected', 'not_applicable'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'amount_collected'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN amount_collected numeric DEFAULT 0 CHECK (amount_collected >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_stock_transactions' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE inventory_stock_transactions 
    ADD COLUMN payment_notes text;
  END IF;
END $$;

-- Update existing removal transactions to have pending payment status
UPDATE inventory_stock_transactions
SET payment_status = 'pending'
WHERE transaction_type = 'removal' 
  AND collection_from_user_id IS NOT NULL
  AND payment_status = 'not_applicable';

-- Create index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transactions_payment_status 
ON inventory_stock_transactions(payment_status) 
WHERE payment_status IN ('pending', 'partial');

-- Create index for user collections
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transactions_user_collections 
ON inventory_stock_transactions(collection_from_user_id, payment_status) 
WHERE collection_from_user_id IS NOT NULL;