-- Fix phone column if it doesn't exist or has issues
-- This migration handles cases where the table was created without the phone column

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT DEFAULT '';
  END IF;
END $$;

-- Add phone_verified column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create unique index on phone (only for non-empty phones)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON public.users(phone) WHERE phone != '';

-- Create regular index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

