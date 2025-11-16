-- Fix phone column - Simple version
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
-- This allows multiple empty strings but enforces uniqueness for actual phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON public.users(phone) WHERE phone != '';

-- Create regular index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

