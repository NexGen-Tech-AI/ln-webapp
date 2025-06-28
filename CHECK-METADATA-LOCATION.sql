-- Let's check what columns actually exist in auth.users and where the metadata is stored

-- 1. Show all columns in auth.users
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%meta%'
ORDER BY ordinal_position;

-- 2. Check a recent user to see where metadata is stored
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
AND raw_user_meta_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check if the admin API stores metadata differently
-- The issue might be that when creating users via admin API, 
-- the metadata goes into raw_user_meta_data after all