# Autobanden en Velgen - Setup Instructions

## Vercel Deployment Setup

### 1. Environment Variables in Vercel
In your Vercel dashboard, go to your project settings and add these environment variables:

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL (e.g., https://your-project.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anonymous key

### 2. Supabase Setup
1. Create a new Supabase project
2. Go to Settings > API to get your URL and anon key
3. Run the SQL scripts in the Supabase SQL Editor:
   - First run `scripts/01-setup-database.sql`
   - Then run `scripts/02-seed-products.sql`

### 3. Admin User Setup
1. After deployment, register with:
   - Email: admin@banden.autos
   - Password: Sales2025!@
2. This user will automatically get admin privileges

### 4. Features
- ✅ Product management (tires and rims)
- ✅ User authentication with Supabase
- ✅ Admin dashboard for CRUD operations
- ✅ User role management
- ✅ Responsive Dutch interface
- ✅ Search and filter functionality

### 5. Admin Access
Once logged in as admin, you'll see the "Admin Dashboard" button in the header to manage products and users.
