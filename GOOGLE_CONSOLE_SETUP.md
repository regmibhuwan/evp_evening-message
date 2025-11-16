# How to Add Supabase Callback URL in Google Cloud Console

## Step-by-Step Instructions:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Select Your Project
- Click the project dropdown at the top (next to "Google Cloud")
- Select the project that contains your OAuth 2.0 Client ID
- If you don't see it, make sure you're using the correct Google account

### 3. Navigate to APIs & Services → Credentials
- In the left sidebar, click "APIs & Services"
- Click "Credentials" in the submenu

### 4. Find Your OAuth 2.0 Client
- Look for your OAuth 2.0 Client ID in the list
- The Client ID should be: `334224559812-hgjjshc5n3t7tmqllldmedq70jh2fpgh.apps.googleusercontent.com`
- Click on the Client ID name to edit it

### 5. Add Authorized Redirect URIs
- Scroll down to the "Authorized redirect URIs" section
- Click "ADD URI" button
- Add these URLs one by one:

**For Supabase:**
```
https://huvuhuadutudukyplsji.supabase.co/auth/v1/callback
```

**For Local Development:**
```
http://localhost:3003/auth/callback
```

**For Production (if you have a Vercel/deployed URL):**
```
https://your-app.vercel.app/auth/callback
```
(Replace `your-app.vercel.app` with your actual domain)

### 6. Save Changes
- Click "SAVE" at the bottom of the page
- Wait for the confirmation message

### 7. Verify the Changes
- Make sure all the redirect URIs are listed in the "Authorized redirect URIs" section
- They should look like:
  - `https://huvuhuadutudukyplsji.supabase.co/auth/v1/callback`
  - `http://localhost:3003/auth/callback`

## Important Notes:

1. **Exact Match Required**: The redirect URIs must match exactly (including `http://` vs `https://`, trailing slashes, etc.)

2. **Supabase URL Format**: The Supabase callback URL follows this pattern:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Your project ref is: `huvuhuadutudukyplsji`

3. **Local Development**: Make sure to add `http://localhost:3003/auth/callback` for local testing

4. **Changes Take Effect Immediately**: Once saved, the changes are active right away (no waiting period)

## After Adding:

1. Go back to Supabase and enable Google OAuth (if you haven't already)
2. Add the same Client ID and Client Secret in Supabase Authentication → Providers → Google
3. Try signing up with Google again - it should work!

## Troubleshooting:

- **"redirect_uri_mismatch" error**: Double-check that the redirect URI in Google Console matches exactly what Supabase is using
- **Can't find the OAuth client**: Make sure you're in the correct Google Cloud project
- **Changes not working**: Wait a minute and try again, or clear your browser cache

