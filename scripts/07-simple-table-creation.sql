-- Create user roles enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'buyer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('tire', 'rim');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'buyer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  type product_type NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  specifications TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_auth" ON products;
DROP POLICY IF EXISTS "products_update_auth" ON products;
DROP POLICY IF EXISTS "products_delete_auth" ON products;

-- Create simple RLS policies
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "products_select_all" ON products 
  FOR SELECT USING (true);

CREATE POLICY "products_insert_auth" ON products 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_update_auth" ON products 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_delete_auth" ON products 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@banden.autos' THEN 'admin'::user_role
      ELSE 'buyer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN EXCLUDED.email = 'admin@banden.autos' THEN 'admin'::user_role
      ELSE profiles.role
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample data
INSERT INTO products (id, type, brand, model, specifications, price, stock) 
VALUES
  ('MICH-PS4-22555R17', 'tire', 'Michelin', 'Pilot Sport 4', '225/55R17', 189.99, 24),
  ('CONT-SC6-19545R16', 'tire', 'Continental', 'SportContact 6', '195/45R16', 159.99, 8),
  ('BRID-LM005-21550R17', 'tire', 'Bridgestone', 'Blizzak LM005', '215/50R17', 179.99, 32),
  ('OZ-RACING-17X7', 'rim', 'OZ Racing', 'Ultraleggera', '17x7 ET42 5x108', 299.99, 12),
  ('BBS-CH-R-18X8', 'rim', 'BBS', 'CH-R', '18x8 ET35 5x120', 459.99, 6),
  ('ENKEI-RPF1-17X8', 'rim', 'Enkei', 'RPF1', '17x8 ET45 5x114.3', 189.99, 18)
ON CONFLICT (id) DO NOTHING;
