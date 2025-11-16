# EVP Night Shift Message Sender

A comprehensive mobile-first web app for night shift workers to communicate with office staff, organize carpools, and find housing/rentals.

## Features

- **Gmail Verification** - One-click Gmail authentication for secure identity verification
- **Night Shift Messages** - Submit messages to office staff with category-based routing
- **Carpool System** - Offer or request carpools with chat functionality
- **Housing/Rentals** - Post and browse housing listings with contact exchange
- **Real-time Chat** - Chat with other users on carpool and housing posts
- **Email Notifications** - Receive email notifications for new chat messages
- **Contact Exchange** - Securely exchange contact information with other users
- **Mobile-first design** - Optimized for phone use
- **Anonymous feedback option** - Submit feedback anonymously for sensitive matters

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=EVP Night Shift <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Google OAuth (for Gmail verification)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# JWT Secret (for session management)
JWT_SECRET=your_random_secret_key_here
```

**Getting Required API Keys:**

1. **Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Create an API key in the dashboard
   - Add it to your `.env.local` file

2. **Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins: `http://localhost:3000` (and your production URL)
   - Add authorized redirect URIs: `http://localhost:3000` (and your production URL)
   - Copy the Client ID and Client Secret to your `.env.local` file
   - Use the same Client ID for `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

3. **JWT Secret:**
   - Generate a random secret key (e.g., using `openssl rand -base64 32`)
   - Add it to your `.env.local` file

**Note:** For production, you'll need to:
- Verify your sending domain in Resend
- Update `EMAIL_FROM` to use your verified domain (e.g., `EVP Night Shift <messages@yourdomain.com>`)
- Update Google OAuth authorized origins and redirect URIs with your production URL

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Edit `config.ts` to customize:

- **Category mappings** - Add or modify categories and their email recipients

## Category Mappings

The app includes the following default categories:

- **Anonymous Company Feedback** - For anonymous company-related feedback
- **Payroll / CFO Inquiry** - For payroll and financial inquiries
- **Business Operations** - For operations-related messages
- **People Services (HR)** - For HR-related inquiries
- **General Inquiry** - For general questions and messages

All categories can be customized in `config.ts` to route to specific email addresses.

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Recommended Platforms

- **Vercel** - Optimized for Next.js (recommended)
- **Netlify** - Good Next.js support
- **Railway** - Easy deployment with database support

### Environment Variables for Production

Make sure to set:
- `RESEND_API_KEY` - Your Resend API key
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://yourdomain.com`)
- `EMAIL_FROM` - Your verified email address (e.g., `Eden Valley Poultry - Evening Shift <messages@yourdomain.com>`)

### Database

The SQLite database is stored in the `data/` directory. For production, consider:
- Using a managed database service (PostgreSQL, MySQL)
- Backing up the database regularly
- Using environment-specific database paths

## Project Structure

```
evp/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints (Google OAuth)
│   │   ├── carpool/           # Carpool CRUD endpoints
│   │   ├── housing/           # Housing CRUD endpoints
│   │   ├── chat/              # Chat message endpoints
│   │   ├── contact/           # Contact exchange endpoints
│   │   ├── send/              # Night shift message sending endpoint
│   │   └── user/              # User info endpoints
│   ├── carpool/               # Carpool pages (listings, detail, chat)
│   ├── housing/               # Housing pages (listings, detail, chat)
│   ├── verify/                # Gmail verification page
│   ├── success/               # Success confirmation page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main night shift message form
│   └── globals.css            # Global styles
├── lib/
│   ├── auth.ts               # Authentication utilities (JWT, Google OAuth)
│   ├── db.ts                 # Database utilities (SQLite)
│   ├── email.ts              # Email sending utilities
│   └── useAuth.ts            # Client-side auth hook
├── config.ts                 # Configuration and category mappings
├── data/                     # SQLite database directory
├── package.json
└── README.md
```

## License

Private - Internal use only

