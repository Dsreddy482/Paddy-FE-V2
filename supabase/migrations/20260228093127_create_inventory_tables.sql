/*
  # Inventory Management System

  ## Overview
  Creates tables for managing inventory master data and stock levels.

  ## New Tables

  ### 1. `inventory_items`
  Master data for different types of inventory items
  - `id` (uuid, primary key) - Unique identifier
  - `item_name` (text) - Name of the inventory item
  - `item_code` (text, unique) - Unique code for the item
  - `category` (text) - Category/type of inventory (e.g., Seeds, Fertilizers, Tools, Pesticides)
  - `unit` (text) - Unit of measurement (kg, liters, pieces, bags, etc.)
  - `description` (text) - Detailed description of the item
  - `minimum_stock` (numeric) - Minimum stock level for alerts
  - `current_stock` (numeric) - Current stock quantity
  - `unit_price` (numeric) - Price per unit
  - `status` (text) - Item status (active, inactive)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `inventory_stock_transactions`
  Tracks all stock movements (additions and removals)
  - `id` (uuid, primary key) - Unique identifier
  - `inventory_item_id` (uuid, foreign key) - Reference to inventory item
  - `transaction_type` (text) - Type of transaction (addition, removal, adjustment)
  - `quantity` (numeric) - Quantity added or removed (positive for additions, negative for removals)
  - `reference_number` (text) - Reference number for the transaction
  - `notes` (text) - Additional notes about the transaction
  - `transaction_date` (timestamptz) - When the transaction occurred
  - `created_by` (uuid) - User who created the transaction
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage inventory
*/

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  minimum_stock NUMERIC NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  current_stock NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_stock_transactions table
CREATE TABLE IF NOT EXISTS inventory_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('addition', 'removal', 'adjustment')),
  quantity NUMERIC NOT NULL,
  reference_number TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_items
CREATE POLICY "Allow authenticated users to read inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- Policies for inventory_stock_transactions
CREATE POLICY "Allow authenticated users to read stock transactions"
  ON inventory_stock_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert stock transactions"
  ON inventory_stock_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update stock transactions"
  ON inventory_stock_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete stock transactions"
  ON inventory_stock_transactions FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON inventory_stock_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON inventory_stock_transactions(transaction_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory_items
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();