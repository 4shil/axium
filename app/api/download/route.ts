import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPresignedDownloadUrl, deleteObject } from '@/lib/b2';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'MISSING SLUG' },
        { status: 400 }
      );
    }

    // Find the file
    const file = await prisma.file.findUnique({
      where: { slug },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'FILE NOT FOUND' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > file.expiresAt) {
      // Clean up expired file
      try {
        await deleteObject(file.b2ObjectKey);
        await prisma.file.delete({ where: { slug } });
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
    await prisma.file.update({
      where: { slug },
      data: { downloadCount: file.downloadCount + 1 },
    });

    // If one-time download, schedule deletion
    if (file.oneTimeDownload) {
      // Delete after a short delay to allow download to start
      setTimeout(async () => {
        try {
          await deleteObject(file.b2ObjectKey);
          await prisma.file.delete({ where: { slug } });
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

  const file = await prisma.file.findUnique({
    where: { slug },
    select: {
      originalName: true,
      size: true,
      expiresAt: true,
      passwordHash: true,
      downloadCount: true,
      oneTimeDownload: true,
      maxDownloads: true,
      createdAt: true,
    },
  });

  if (!file) {
    return NextResponse.json(
      { error: 'FILE NOT FOUND' },
      { status: 404 }
    );
  }

  // Check if expired
  if (new Date() > file.expiresAt) {
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
    expiresAt: file.expiresAt.toISOString(),
    requiresPassword: !!file.passwordHash,
    downloadCount: file.downloadCount,
    oneTimeDownload: file.oneTimeDownload,
    maxDownloads: file.maxDownloads,
  });
}
