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

-- Create profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'buyer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.products (
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_insert_auth" ON public.products;
DROP POLICY IF EXISTS "products_update_auth" ON public.products;
DROP POLICY IF EXISTS "products_delete_auth" ON public.products;

-- Create simple, non-recursive RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Product policies - allow all authenticated users to manage products
CREATE POLICY "products_select_all" ON public.products 
  FOR SELECT USING (true);

CREATE POLICY "products_insert_auth" ON public.products 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_update_auth" ON public.products 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_delete_auth" ON public.products 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data (only if tables are empty)
INSERT INTO public.products (id, type, brand, model, specifications, price, stock) 
SELECT * FROM (VALUES
  ('MICH-PS4-22555R17', 'tire', 'Michelin', 'Pilot Sport 4', '225/55R17', 189.99, 24),
  ('CONT-SC6-19545R16', 'tire', 'Continental', 'SportContact 6', '195/45R16', 159.99, 8),
  ('BRID-LM005-21550R17', 'tire', 'Bridgestone', 'Blizzak LM005', '215/50R17', 179.99, 32),
  ('OZ-RACING-17X7', 'rim', 'OZ Racing', 'Ultraleggera', '17x7 ET42 5x108', 299.99, 12),
  ('BBS-CH-R-18X8', 'rim', 'BBS', 'CH-R', '18x8 ET35 5x120', 459.99, 6),
  ('ENKEI-RPF1-17X8', 'rim', 'Enkei', 'RPF1', '17x8 ET45 5x114.3', 189.99, 18)
) AS v(id, type, brand, model, specifications, price, stock)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1)
ON CONFLICT (id) DO NOTHING;
