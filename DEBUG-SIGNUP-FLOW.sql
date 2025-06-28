-- DEBUG: Let's see what's actually happening

-- 1. Check if the trigger exists and what it looks like
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text IN ('auth.users', 'public.users')
ORDER BY tgrelid::regclass::text, tgname;

-- 2. Check the actual function definition
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check recent auth.users to see what data they have
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if those users exist in public.users
SELECT 
    u.id,
    u.email,
    u.name,
    u.profession,
    u.company,
    u.interests,
    u.tier_preference,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- 5. Check for any errors in the postgres logs
-- (You'll need to check this in Supabase Dashboard > Logs > Postgres)