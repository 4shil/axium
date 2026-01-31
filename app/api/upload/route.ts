import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPresignedUploadUrl, generateObjectKey } from '@/lib/b2';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB default
const ALLOWED_EXPIRY = [10, 60, 120]; // minutes

interface UploadRequest {
  filename: string;
  size: number;
  contentType: string;
  expiryMinutes: number;
  slug?: string;
  password?: string;
  oneTimeDownload?: boolean;
  maxDownloads?: number;
}

function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{6,30}$/;
  return slugRegex.test(slug);
}

function generateSlug(): string {
  return nanoid(8).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadRequest = await request.json();
    
    // Validate required fields
    if (!body.filename || !body.size || !body.contentType) {
      return NextResponse.json(
        { error: 'MISSING REQUIRED FIELDS' },
        { status: 400 }
      );
    }

    // Validate file size
    if (body.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'FILE TOO LARGE' },
        { status: 400 }
      );
    }

    // Validate expiry
    if (!ALLOWED_EXPIRY.includes(body.expiryMinutes)) {
      return NextResponse.json(
        { error: 'INVALID EXPIRY TIME' },
        { status: 400 }
      );
    }

    // Handle slug
    let slug = body.slug?.trim().toLowerCase();
    if (slug) {
      if (!validateSlug(slug)) {
        return NextResponse.json(
          { error: 'INVALID SLUG FORMAT' },
          { status: 400 }
        );
      }
      
      // Check if slug already exists
      const existing = await prisma.file.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json(
          { error: 'SLUG ALREADY TAKEN' },
          { status: 409 }
        );
      }
    } else {
      // Generate random slug
      slug = generateSlug();
      // Ensure uniqueness
      let attempts = 0;
      while (await prisma.file.findUnique({ where: { slug } })) {
        slug = generateSlug();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'COULD NOT GENERATE UNIQUE SLUG' },
            { status: 500 }
          );
        }
      }
    }

    // Generate object key for B2
    const objectKey = generateObjectKey(slug, body.filename);

    // Generate presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(objectKey, body.contentType);

    // Hash password if provided
    let passwordHash: string | null = null;
    if (body.password && body.password.length > 0) {
      passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + body.expiryMinutes * 60 * 1000);

    // Create database record
    await prisma.file.create({
      data: {
        slug,
        b2ObjectKey: objectKey,
        originalName: body.filename,
        size: BigInt(body.size),
        mimeType: body.contentType,
        expiresAt,
        passwordHash,
        oneTimeDownload: body.oneTimeDownload || false,
        maxDownloads: body.maxDownloads || null,
      },
    });

    return NextResponse.json({
      uploadUrl,
      slug,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}
