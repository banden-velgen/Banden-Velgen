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

-- Create new simplified RLS policies for profiles (no recursion)
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Create new simplified RLS policies for products
CREATE POLICY "products_select_all" ON public.products 
  FOR SELECT USING (true);

CREATE POLICY "products_insert_auth" ON public.products 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_update_auth" ON public.products 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_delete_auth" ON public.products 
  FOR DELETE USING (auth.uid() IS NOT NULL);
