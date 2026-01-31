import { NextRequest, NextResponse } from 'next/server';
import { getFileBySlug, updateFile, deleteFile } from '@/lib/storage';
import { getPresignedDownloadUrl, deleteObject } from '@/lib/b2';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(
      getRateLimitKey(ip, 'download'),
      RATE_LIMITS.download
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE LIMIT EXCEEDED. TRY AGAIN LATER.' },
        { status: 429 }
      );
    }

    const { slug, password } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'MISSING SLUG' },
        { status: 400 }
      );
    }

    // Find the file
    const file = await getFileBySlug(slug);

    if (!file) {
      return NextResponse.json(
        { error: 'FILE NOT FOUND' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > new Date(file.expiresAt)) {
      // Clean up expired file (this might be handled by cleanup cron, but redundant check)
      try {
        await deleteObject(file.b2ObjectKey);
        await deleteFile(slug);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
      return NextResponse.json(
        { error: 'FILE EXPIRED' },
        { status: 410 }
      );
    }

    // Check download limits
    if (file.oneTimeDownload && file.downloadCount >= 1) {
      return NextResponse.json(
        { error: 'FILE ALREADY DOWNLOADED' },
        { status: 410 }
      );
    }

    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return NextResponse.json(
        { error: 'DOWNLOAD LIMIT REACHED' },
        { status: 410 }
      );
    }

    // Check password
    if (file.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: 'PASSWORD REQUIRED', requiresPassword: true },
          { status: 401 }
        );
      }
      
      const passwordValid = await bcrypt.compare(password, file.passwordHash);
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'INVALID PASSWORD' },
          { status: 401 }
        );
      }
    }

    // Generate presigned download URL
    const downloadUrl = await getPresignedDownloadUrl(
      file.b2ObjectKey,
      file.originalName
    );

    // Increment download count
    await updateFile(slug, { downloadCount: file.downloadCount + 1 });

    // If one-time download, schedule deletion
    if (file.oneTimeDownload) {
      // Delete after a short delay to allow download to start
      setTimeout(async () => {
        try {
          await deleteObject(file.b2ObjectKey);
          await deleteFile(slug);
        } catch (e) {
          console.error('One-time cleanup error:', e);
        }
      }, 60000); // 1 minute delay
    }

    return NextResponse.json({
      downloadUrl,
      filename: file.originalName,
      size: file.size.toString(),
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}

// GET endpoint to check file status (no password required)
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'MISSING SLUG' },
      { status: 400 }
    );
  }

  const file = await getFileBySlug(slug);

  if (!file) {
    return NextResponse.json(
      { error: 'FILE NOT FOUND' },
      { status: 404 }
    );
  }

  // Check if expired
  if (new Date() > new Date(file.expiresAt)) {
    return NextResponse.json(
      { error: 'FILE EXPIRED' },
      { status: 410 }
    );
  }

  // Check download limits
  if (file.oneTimeDownload && file.downloadCount >= 1) {
    return NextResponse.json(
      { error: 'FILE ALREADY DOWNLOADED' },
      { status: 410 }
    );
  }

  if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
    return NextResponse.json(
      { error: 'DOWNLOAD LIMIT REACHED' },
      { status: 410 }
    );
  }

  return NextResponse.json({
    filename: file.originalName,
    size: file.size.toString(),
    expiresAt: file.expiresAt,
    requiresPassword: !!file.passwordHash,
    downloadCount: file.downloadCount,
    oneTimeDownload: file.oneTimeDownload,
    maxDownloads: file.maxDownloads,
  });
}
