/*
  # Create Paddy Fields Table

  1. New Tables
    - `paddy_fields`
      - `id` (uuid, primary key) - Unique identifier for the field
      - `field_name` (text) - Name of the paddy field
      - `location` (text) - Location/address of the field
      - `area` (numeric) - Size of the field
      - `unit` (text) - Unit of measurement (acres, hectares, guntas)
      - `status` (text) - Status of the field (active, inactive)
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  2. Security
    - Enable RLS on `paddy_fields` table
    - Add policy for authenticated users to read all fields
    - Add policy for admin users to insert fields
    - Add policy for admin users to update fields
    - Add policy for admin users to delete fields

  3. Notes
    - Only admin users can create, update, or delete paddy fields
    - All authenticated users can view paddy fields
    - Timestamps are automatically managed
*/

CREATE TABLE IF NOT EXISTS paddy_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  location text NOT NULL,
  area numeric NOT NULL CHECK (area > 0),
  unit text NOT NULL CHECK (unit IN ('acres', 'hectares', 'guntas')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE paddy_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view paddy fields"
  ON paddy_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert paddy fields"
  ON paddy_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin users can update paddy fields"
  ON paddy_fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin users can delete paddy fields"
  ON paddy_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_paddy_fields_status ON paddy_fields(status);
CREATE INDEX IF NOT EXISTS idx_paddy_fields_created_at ON paddy_fields(created_at DESC);
