-- Create waitlist_count view for efficient counting
CREATE OR REPLACE VIEW public.waitlist_count AS
SELECT 
    COUNT(*) as total_users
FROM public.users
WHERE user_type = 'waitlist';

-- Grant appropriate permissions
GRANT SELECT ON public.waitlist_count TO anon;
GRANT SELECT ON public.waitlist_count TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- Add comment for documentation
COMMENT ON VIEW public.waitlist_count IS 'Provides efficient count of waitlist users for the API';