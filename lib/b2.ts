import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// B2 configuration from environment variables
const B2_ENDPOINT = process.env.B2_ENDPOINT || '';
const B2_REGION = process.env.B2_REGION || 'eu-central-003';
const B2_KEY_ID = process.env.B2_KEY_ID || '';
const B2_APP_KEY = process.env.B2_APP_KEY || '';
const B2_BUCKET = process.env.B2_BUCKET || 'axium-files';

// Create S3 client for B2
const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
});

/**
 * Generate a presigned URL for uploading a file directly to B2
 */
export async function getPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from B2
 */
export async function getPresignedDownloadUrl(
  objectKey: string,
  originalFilename: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: B2_BUCKET,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from B2
 */
export async function deleteObject(objectKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: B2_BUCKET,
    Key: objectKey,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique object key for storing a file
 */
export function generateObjectKey(slug: string, originalFilename: string): string {
  const timestamp = Date.now();
  const ext = originalFilename.includes('.') 
    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
    : '';
  return `uploads/${slug}-${timestamp}${ext}`;
}
