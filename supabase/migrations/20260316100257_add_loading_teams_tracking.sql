-- Add Loading Teams Tracking
--
-- 1. New Tables
--    - loading_entries: Track loading operations with team information
--
-- 2. Security
--    - Enable RLS on loading_entries table
--    - Add policies for authenticated users to manage loading entries
--
-- 3. Features
--    - Supports separate teams for Potha, Kata, Loading operations
--    - Supports combined team for all operations
--    - Tracks payment rates per operation type

CREATE TABLE IF NOT EXISTS loading_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lorry_number text NOT NULL,
  loaded_date date NOT NULL,
  dealer_id uuid REFERENCES auth.users(id),
  amali_id uuid REFERENCES auth.users(id),
  season_id uuid,
  total_load_weight numeric DEFAULT 0 CHECK (total_load_weight >= 0),
  total_no_of_bags numeric DEFAULT 0 CHECK (total_no_of_bags >= 0),
  status text DEFAULT 'pending',
  payment_done boolean DEFAULT false,
  
  -- Separate team tracking
  potha_team_id uuid REFERENCES auth.users(id),
  potha_team_name text,
  potha_rate_per_bag numeric DEFAULT 0 CHECK (potha_rate_per_bag >= 0),
  
  kata_team_id uuid REFERENCES auth.users(id),
  kata_team_name text,
  kata_rate_per_bag numeric DEFAULT 0 CHECK (kata_rate_per_bag >= 0),
  
  loading_team_id uuid REFERENCES auth.users(id),
  loading_team_name text,
  loading_rate_per_bag numeric DEFAULT 0 CHECK (loading_rate_per_bag >= 0),
  
  -- Combined operation tracking
  is_combined_operation boolean DEFAULT false,
  combined_team_id uuid REFERENCES auth.users(id),
  combined_team_name text,
  combined_rate_per_bag numeric DEFAULT 0 CHECK (combined_rate_per_bag >= 0),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loading_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view loading entries"
  ON loading_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loading entries"
  ON loading_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loading entries"
  ON loading_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete loading entries"
  ON loading_entries FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loading_entries_lorry_number ON loading_entries(lorry_number);
CREATE INDEX IF NOT EXISTS idx_loading_entries_loaded_date ON loading_entries(loaded_date);
CREATE INDEX IF NOT EXISTS idx_loading_entries_dealer_id ON loading_entries(dealer_id);
CREATE INDEX IF NOT EXISTS idx_loading_entries_amali_id ON loading_entries(amali_id);