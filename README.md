# EVP Evening Message Sender

A simple mobile-first web app for workers to submit messages to office staff who leave at 4:00 PM.

## Features

- **Mobile-first design** - Optimized for phone use
- **Category-based routing** - Messages automatically sent to the correct recipient
- **Optional supervisor approval** - Configurable workflow for message approval
- **Clean, simple UI** - Minimal interface focused on ease of use

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=EVP Evening Messages <onboarding@resend.dev>
```

**Getting a Resend API Key:**
1. Sign up at [resend.com](https://resend.com)
2. Create an API key in the dashboard
3. Add it to your `.env.local` file

**Note:** For production, you'll need to:
- Verify your sending domain in Resend
- Update `EMAIL_FROM` to use your verified domain (e.g., `EVP Evening Messages <messages@yourdomain.com>`)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Edit `config.ts` to customize:

- **Category mappings** - Add or modify categories and their email recipients
- **Supervisor approval** - Set `REQUIRE_SUPERVISOR_APPROVAL` to `true` to enable approval workflow
- **Supervisor email** - Set `SUPERVISOR_EMAIL` when approval is enabled

## Category Mappings

The app includes the following default categories:

- **Payroll / CFO** → Luke Hempel (lukeh@edenvalleypoultry.com)
- **Business Operations** → Troy Lenihan (troyl@edenvalleypoultry.com)
- **Sustainability** → Dean Gurney (dgurney@edenvalleypoultry.com)
- **People Services (HR)** → Nicole Hawley (nicoleh@edenvalleypoultry.com)
- **General EVP TVS** → joannm@edenvalleypoultry.com

## Supervisor Approval Workflow

When `REQUIRE_SUPERVISOR_APPROVAL` is set to `true`:

1. Messages are stored in a SQLite database
2. Supervisor receives email notification
3. Supervisor visits `/supervisor` to approve/reject messages
4. Approved messages are sent to recipients
5. Rejected messages are marked as rejected

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
- `EMAIL_FROM` - Your verified email address (e.g., `EVP Evening Messages <messages@yourdomain.com>`)

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
│   │   ├── send/              # Main message sending endpoint
│   │   └── supervisor/        # Supervisor approval endpoints
│   ├── supervisor/            # Supervisor approval page
│   ├── success/               # Success confirmation page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main worker form
│   └── globals.css            # Global styles
├── lib/
│   ├── db.ts                 # Database utilities
│   └── email.ts            # Email sending utilities
├── config.ts               # Configuration and category mappings
├── package.json
└── README.md
```

## License

Private - Internal use only

