import { NextRequest, NextResponse } from 'next/server';
import { getExpiredFiles, deleteFile, getFileBySlug } from '@/lib/storage';
import { deleteObject } from '@/lib/b2';

// This endpoint should be called by a cron job or scheduled task
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
    const expiredFiles = await getExpiredFiles();

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
        
        // Delete from storage
        await deleteFile(file.slug);
        
        results.deleted++;
        console.log(`[CLEANUP] Purged: ${file.slug}`);
      } catch (error) {
        results.errors++;
        console.error(`[CLEANUP] Error deleting ${file.slug}:`, error);
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
