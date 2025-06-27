-- Fix position sequence to start at 100
-- This ensures new users get position numbers starting from 100

-- First, update existing positions to start from 100
UPDATE public.users 
SET position = position + 99
WHERE position < 100;

-- Reset the sequence to continue from the highest position + 1
SELECT setval('users_position_seq', COALESCE((SELECT MAX(position) FROM public.users), 99) + 1, false);

-- Verify the fix
DO $$
DECLARE
  next_val INTEGER;
BEGIN
  SELECT nextval('users_position_seq') INTO next_val;
  RAISE NOTICE 'Next position will be: %', next_val;
  -- Reset it back since we just used it for testing
  PERFORM setval('users_position_seq', next_val - 1);
END $$;