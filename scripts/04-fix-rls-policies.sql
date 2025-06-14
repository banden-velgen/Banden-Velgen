-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create new simplified RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Create new simplified RLS policies for products
CREATE POLICY "Anyone can view products" ON public.products 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage products" ON public.products 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Update the trigger function to handle existing users
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
      ELSE profiles.role -- Keep existing role if not admin email
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
