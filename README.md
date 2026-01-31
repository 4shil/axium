# AXIUM

Temporary file transfer that deletes itself.

## What is AXIUM?

AXIUM is a minimalist web app for temporary file sharing. Upload a file, get a link, share it, and the file is automatically deleted after expiry.

- No accounts
- No permanent storage
- No tracking
- Open source

## Features

- Drag & drop file upload
- Direct upload to Backblaze B2 (files never touch the server)
- Configurable expiry: 10 min, 1 hour, 2 hours
- Custom shareable links
- Password protection
- One-time download mode
- Download count limits
- Automatic cleanup

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Storage:** Backblaze B2 (S3-compatible)
- **Database:** SQLite (Prisma ORM)
- **Design:** Neo-Brutalism

## Self-Hosting

### Prerequisites

- Node.js 20+
- Backblaze B2 account (free tier: 10GB)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/4shil/axium.git
cd axium
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure `.env` with your Backblaze B2 credentials:
```env
B2_ENDPOINT="s3.your-region.backblazeb2.com"
B2_REGION="your-region"
B2_KEY_ID="your_key_id"
B2_APP_KEY="your_app_key"
B2_BUCKET="your-bucket-name"
```

5. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

6. Run development server:
```bash
npm run dev
```

### Backblaze B2 Setup

1. Create account at [backblaze.com](https://www.backblaze.com/sign-up/cloud-storage)
2. Create a **private** bucket
3. Create an Application Key with read/write access to your bucket
4. Note down: Endpoint, Key ID, Application Key, Bucket Name

### Production Deployment

Deploy to Vercel:

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy

The cleanup cron job runs every 15 minutes to delete expired files.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE` | Maximum upload size in bytes | 524288000 (500MB) |
| `B2_BUCKET` | Backblaze B2 bucket name | axium-files |
| `CRON_SECRET` | Secret for cleanup endpoint | (none) |

## Architecture

```
Client (Browser)
    │
    │ presigned upload URL
    ▼
Backblaze B2 (Object Storage)
    │
    │ metadata only
    ▼
AXIUM API (Next.js)
    │
    ▼
SQLite / PostgreSQL
```

**Key principle:** Files never pass through the backend server. The backend only handles authorization, metadata, and presigned URL generation.

## License

MIT

## Credits

Built with Neo-Brutalism design principles.
