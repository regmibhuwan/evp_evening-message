# Supabase Setup Instructions

## 1. Add Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (Database and Authentication)
NEXT_PUBLIC_SUPABASE_URL=https://huvuhuadutudukyplsji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dnVodWFkdXR1ZHVreXBsc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTQ0MTIsImV4cCI6MjA3NjgzMDQxMn0.wkxMCZPim36bWwwDi0j96l-sctEhV8viWjpzA6nPhAs

# Service Role Key (optional - for admin operations, keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dnVodWFkdXR1ZHVreXBsc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI1NDQxMiwiZXhwIjoyMDc2ODMwNDEyfQ.8pvDAcZQFXfDxL6woG05D6q73BA2pG7uW9HxETamkJc
```

## 2. Run SQL Migration in Supabase

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the entire SQL below
5. Click "Run" (or press Ctrl+Enter)

```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '' UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  worker_name TEXT,
  worker_email TEXT,
  worker_phone TEXT,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create carpool_posts table
CREATE TABLE IF NOT EXISTS public.carpool_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('offer', 'request')),
  starting_point TEXT NOT NULL,
  destination TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price TEXT,
  availability TEXT,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create housing_posts table
CREATE TABLE IF NOT EXISTS public.housing_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('shared', 'private')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id BIGINT NOT NULL,
  post_type TEXT NOT NULL CHECK(post_type IN ('carpool', 'housing')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create contact_exchanges table
CREATE TABLE IF NOT EXISTS public.contact_exchanges (
  id BIGSERIAL PRIMARY KEY,
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id BIGINT NOT NULL,
  post_type TEXT NOT NULL CHECK(post_type IN ('carpool', 'housing')),
  contact_shared_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpool_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for messages
CREATE POLICY "Anyone can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- RLS Policies for carpool_posts
CREATE POLICY "Anyone can view carpool posts" ON public.carpool_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create carpool posts" ON public.carpool_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carpool posts" ON public.carpool_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for housing_posts
CREATE POLICY "Anyone can view housing posts" ON public.housing_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create housing posts" ON public.housing_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own housing posts" ON public.housing_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages they sent or received" ON public.chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for contact_exchanges
CREATE POLICY "Users can view their own contact exchanges" ON public.contact_exchanges
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create contact exchanges" ON public.contact_exchanges
  FOR INSERT WITH CHECK (auth.uid() = contact_shared_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carpool_posts_user_id ON public.carpool_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_housing_posts_user_id ON public.housing_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_post ON public.chat_messages(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
```

## 3. Enable Google OAuth in Supabase

1. Go to Authentication → Providers in your Supabase dashboard
2. Enable "Google" provider
3. Add your Google OAuth Client ID and Client Secret
4. Add redirect URL: `https://huvuhuadutudukyplsji.supabase.co/auth/v1/callback`

## 4. Test the Setup

After running the SQL migration:

1. Restart your dev server: `npm run dev`
2. Go to `http://localhost:3002/signup`
3. Try signing up with email/password or Google
4. Complete phone verification (check console for code in dev mode)

