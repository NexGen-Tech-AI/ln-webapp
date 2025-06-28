-- COMPLETE DATABASE FIX - RUN THIS ENTIRE SCRIPT
-- This handles ALL issues including the referral_code constraint

-- Step 1: Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    profession TEXT,
    company TEXT,
    interests TEXT[],
    tier_preference TEXT DEFAULT 'free',
    referred_by UUID,
    referral_code TEXT UNIQUE,
    user_type TEXT DEFAULT 'waitlist',
    auth_provider TEXT DEFAULT 'email',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position INTEGER,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    referral_count INTEGER DEFAULT 0,
    paying_referral_count INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    is_paying BOOLEAN DEFAULT false,
    subscription_tier TEXT,
    subscription_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add any missing columns to existing table
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE public.users ADD COLUMN referral_code TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'position') THEN
        ALTER TABLE public.users ADD COLUMN position INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'interests') THEN
        ALTER TABLE public.users ADD COLUMN interests TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_preference') THEN
        ALTER TABLE public.users ADD COLUMN tier_preference TEXT DEFAULT 'free';
    END IF;
END $$;

-- Step 3: Fix referral_code constraint (remove NOT NULL if it exists)
ALTER TABLE public.users ALTER COLUMN referral_code DROP NOT NULL;

-- Step 4: Create sequence for position if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

-- Step 5: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable insert for auth trigger" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Step 7: Create proper RLS policies
-- Allow users to see their own data
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Allow the auth trigger to insert (this is critical!)
CREATE POLICY "Enable insert for auth trigger" 
ON public.users FOR INSERT 
WITH CHECK (true);

-- Service role bypass
CREATE POLICY "Service role full access" 
ON public.users FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 8: Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_code TEXT;
BEGIN
    -- Generate a unique referral code
    new_referral_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
    
    INSERT INTO public.users (
        id, 
        email,
        name,
        profession,
        company,
        interests,
        tier_preference,
        referral_code,
        position,
        auth_provider
    )
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'profession',
        NEW.raw_user_meta_data->>'company',
        CASE 
            WHEN NEW.raw_user_meta_data->'interests' IS NOT NULL 
            THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'tierPreference', 'free'),
        new_referral_code, -- Always use generated code
        nextval('users_position_seq'),
        COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    -- Handle referral tracking if a referral code was used
    IF NEW.raw_user_meta_data->>'referralCode' IS NOT NULL THEN
        -- Find the referrer by their referral code
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE referral_code = NEW.raw_user_meta_data->>'referralCode';
        
        -- Update the new user's referred_by field
        UPDATE public.users
        SET referred_by = (
            SELECT id FROM public.users 
            WHERE referral_code = NEW.raw_user_meta_data->>'referralCode'
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can insert own audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access audit" 
ON public.audit_logs FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 11: Create referral_tracking table
CREATE TABLE IF NOT EXISTS public.referral_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_successful BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    first_payment_at TIMESTAMP WITH TIME ZONE,
    subscription_tier TEXT,
    subscription_amount DECIMAL(10,2),
    UNIQUE(referrer_id, referred_id)
);

-- Step 12: Generate referral codes for users who don't have them
UPDATE public.users
SET referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

-- Step 13: Sync existing auth users who don't have profiles
INSERT INTO public.users (id, email, referral_code, position, created_at)
SELECT 
    au.id, 
    au.email,
    upper(substr(md5(random()::text || au.id::text), 1, 8)) as referral_code,
    nextval('users_position_seq'),
    au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 14: Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE users_position_seq TO authenticated;
GRANT USAGE ON SEQUENCE users_position_seq TO anon;

-- Step 15: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Step 16: Verify everything is working
DO $$
DECLARE
    user_count INTEGER;
    auth_count INTEGER;
    null_codes INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO null_codes FROM public.users WHERE referral_code IS NULL;
    
    RAISE NOTICE 'Users in public.users: %', user_count;
    RAISE NOTICE 'Users in auth.users: %', auth_count;
    RAISE NOTICE 'Users without referral codes: %', null_codes;
    
    IF user_count != auth_count THEN
        RAISE WARNING 'User count mismatch! auth.users has % but public.users has %', auth_count, user_count;
    END IF;
    
    IF null_codes > 0 THEN
        RAISE WARNING 'There are still % users without referral codes!', null_codes;
    END IF;
END $$;

-- DONE! This should fix ALL your issues.