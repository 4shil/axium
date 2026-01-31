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
- Direct upload to Amazon S3 (files never touch the server)
- Configurable expiry: 10 min, 1 hour, 2 hours
- Custom shareable links
- Password protection
- One-time download mode
- Download count limits
- Automatic cleanup

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Storage:** Amazon S3
- **Database:** In-memory (for demo) / Redis recommended for production
- **Design:** Neo-Brutalism

## Self-Hosting

### Prerequisites

- Node.js 20+
- AWS account with S3 access

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

4. Configure `.env` with your AWS S3 credentials:
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key_id"
AWS_SECRET_ACCESS_KEY="your_secret_access_key"
AWS_S3_BUCKET="your-bucket-name"
# AWS_S3_ENDPOINT="(optional, for S3-compatible services)"
```

5. Run development server:
```bash
npm run dev
```

### Amazon S3 Setup

1. Sign in to the [AWS Console](https://aws.amazon.com/console/)
2. Create a new S3 bucket (private recommended)
3. Create an IAM user with S3 read/write permissions for your bucket
4. Generate access keys for the IAM user
5. Note down: Region, Access Key ID, Secret Access Key, Bucket Name

### Production Deployment (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Add environment variables:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET`
   - `CRON_SECRET` (for cleanup endpoint)
4. Deploy!

For cleanup, set up a cron job to call `/api/cleanup` with `Authorization: Bearer <CRON_SECRET>` every 15 minutes.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE` | Maximum upload size in bytes | 524288000 (500MB) |
| `AWS_S3_BUCKET` | Amazon S3 bucket name | axium-files |
| `CRON_SECRET` | Secret for cleanup endpoint | (none) |

## Architecture

```
Client (Browser)
    │
    │ presigned upload URL
    ▼
Amazon S3 (Object Storage)
    │
    │ metadata only
    ▼
AXIUM API (Next.js)
    │
    ▼
In-Memory Store / Redis
```

**Key principle:** Files never pass through the backend server. The backend only handles authorization, metadata, and presigned URL generation.

## License

MIT

## Credits

Built with Neo-Brutalism design principles.
