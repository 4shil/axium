import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteObject } from '@/lib/b2';

// This endpoint should be called by a cron job (Vercel Cron, external service, etc.)
// Protected by CRON_SECRET environment variable

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    
    // Find all expired files
    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    console.log(`[CLEANUP] Found ${expiredFiles.length} expired files`);

    const results = {
      processed: 0,
      deleted: 0,
      errors: 0,
    };

    // Delete each expired file
    for (const file of expiredFiles) {
      results.processed++;
      
      try {
        // Delete from B2
        await deleteObject(file.b2ObjectKey);
        
        // Delete from database
        await prisma.file.delete({
          where: { id: file.id },
        });
        
        results.deleted++;
        console.log(`[CLEANUP] Purged: ${file.slug}`);
      } catch (error) {
        results.errors++;
        console.error(`[CLEANUP] Error deleting ${file.slug}:`, error);
      }
    }

    // Also clean up files that have exceeded download limits
    const limitedFiles = await prisma.file.findMany({
      where: {
        OR: [
          {
            oneTimeDownload: true,
            downloadCount: { gte: 1 },
          },
          {
            maxDownloads: { not: null },
            downloadCount: { gte: prisma.file.fields.maxDownloads },
          },
        ],
      },
    });

    for (const file of limitedFiles) {
      if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
        results.processed++;
        try {
          await deleteObject(file.b2ObjectKey);
          await prisma.file.delete({ where: { id: file.id } });
          results.deleted++;
          console.log(`[CLEANUP] Purged (limit reached): ${file.slug}`);
        } catch (error) {
          results.errors++;
          console.error(`[CLEANUP] Error deleting ${file.slug}:`, error);
        }
      }
    }

    return NextResponse.json({
      status: 'OK',
      timestamp: now.toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[CLEANUP] Fatal error:', error);
    return NextResponse.json(
      { error: 'CLEANUP FAILED' },
      { status: 500 }
    );
  }
}
