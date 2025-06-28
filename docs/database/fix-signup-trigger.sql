-- Fix the handle_new_user trigger to handle metadata properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create user record
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update with metadata - handle referralCode field name
    UPDATE public.users 
    SET 
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        profession = NEW.raw_user_meta_data->>'profession',
        company = NEW.raw_user_meta_data->>'company',
        interests = CASE 
            WHEN NEW.raw_user_meta_data->'interests' IS NOT NULL 
            THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
            ELSE NULL
        END,
        tier_preference = COALESCE(NEW.raw_user_meta_data->>'tierPreference', 'free'),
        referred_by = COALESCE(NEW.raw_user_meta_data->>'referralCode', NEW.raw_user_meta_data->>'referred_by'),
        user_type = COALESCE(NEW.raw_user_meta_data->>'user_type', 'waitlist'),
        auth_provider = COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
        joined_at = NOW(),
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        referral_code = COALESCE(referral_code, generate_referral_code()),
        position = COALESCE(position, nextval('users_position_seq'))
    WHERE id = NEW.id;
    
    -- Encrypt sensitive data if columns exist
    UPDATE public.users
    SET 
        email_encrypted = CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'email_encrypted')
            THEN encrypt_sensitive(email) 
            ELSE NULL 
        END,
        profession_encrypted = CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'profession_encrypted')
            THEN encrypt_sensitive(profession) 
            ELSE NULL 
        END,
        company_encrypted = CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'company_encrypted')
            THEN encrypt_sensitive(company) 
            ELSE NULL 
        END
    WHERE id = NEW.id;
    
    -- Handle referral tracking - use the referralCode from metadata
    IF NEW.raw_user_meta_data->>'referralCode' IS NOT NULL THEN
        -- Find user by referral code
        DECLARE
            referrer_id UUID;
        BEGIN
            SELECT id INTO referrer_id 
            FROM public.users 
            WHERE referral_code = NEW.raw_user_meta_data->>'referralCode'
            LIMIT 1;
            
            IF referrer_id IS NOT NULL THEN
                -- Update the referred_by field with the actual user ID
                UPDATE public.users
                SET referred_by = referrer_id
                WHERE id = NEW.id;
                
                -- Create referral tracking entry
                INSERT INTO public.referral_tracking (referrer_id, referred_id)
                VALUES (referrer_id, NEW.id)
                ON CONFLICT (referrer_id, referred_id) DO NOTHING;
                
                -- Update referral count
                UPDATE public.users
                SET referral_count = COALESCE(referral_count, 0) + 1
                WHERE id = referrer_id;
            END IF;
        END;
    END IF;
    
    -- Create notification preferences if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'notification_preferences') THEN
        INSERT INTO public.notification_preferences (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Ensure the referral_tracking table exists
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

-- Ensure the audit_logs table exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Grant permissions
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO anon;