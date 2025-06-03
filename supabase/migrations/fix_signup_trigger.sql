-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function that handles metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  metadata jsonb;
BEGIN
  -- Get metadata from the auth user
  metadata := NEW.raw_user_meta_data;
  
  -- Insert with all available data
  INSERT INTO public.users (
    id, 
    email,
    name,
    profession,
    company,
    interests,
    tier_preference,
    referred_by
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(metadata->>'name', NULL),
    COALESCE(metadata->>'profession', NULL),
    COALESCE(metadata->>'company', NULL),
    CASE 
      WHEN metadata->'interests' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(metadata->'interests'))
      ELSE 
        '{}'::text[]
    END,
    COALESCE(metadata->>'tierPreference', 'free'),
    COALESCE(metadata->>'referralCode', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    profession = EXCLUDED.profession,
    company = EXCLUDED.company,
    interests = EXCLUDED.interests,
    tier_preference = EXCLUDED.tier_preference,
    referred_by = EXCLUDED.referred_by,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Also create a function to handle email verification
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- When email is confirmed in auth.users, update our users table
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email verification
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verification();