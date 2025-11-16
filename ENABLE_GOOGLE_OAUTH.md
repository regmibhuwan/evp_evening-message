# How to Enable Google OAuth in Supabase

The error "Unsupported provider: provider is not enabled" means Google OAuth is not enabled in your Supabase project.

## Steps to Enable Google OAuth:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `huvuhuadutudukyplsji`

2. **Navigate to Authentication → Providers**
   - In the left sidebar, click "Authentication"
   - Click "Providers" in the submenu

3. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Toggle it to "Enabled"
   - You'll see fields for:
     - **Client ID (for OAuth)**: Enter your Google Client ID
     - **Client Secret (for OAuth)**: Enter your Google Client Secret

4. **Add Your Google OAuth Credentials**
   - Use the same credentials you have in `.env.local`:
     - Client ID: `your_google_client_id_here`
     - Client Secret: `your_google_client_secret_here`

5. **Add Redirect URL in Supabase**
   - In the Google provider settings, add this redirect URL:
     - `https://huvuhuadutudukyplsji.supabase.co/auth/v1/callback`
   - This is your Supabase project's callback URL

6. **Save the Settings**
   - Click "Save" at the bottom of the provider settings

7. **Also Update Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your OAuth 2.0 Client
   - Under "Authorized redirect URIs", make sure you have:
     - `https://huvuhuadutudukyplsji.supabase.co/auth/v1/callback` (for Supabase)
     - `http://localhost:3003/auth/callback` (for local development)
     - Your production URL if you have one

## After Enabling:

Once Google OAuth is enabled in Supabase, try signing up with Google again. The error should be resolved.

## Alternative: Use Email/Password Sign Up

If you want to test the app without setting up Google OAuth, you can use the email/password sign up option instead.

