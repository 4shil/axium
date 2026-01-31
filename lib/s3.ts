import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 configuration from environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'axium-files';
const AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT; // Optional, for S3-compatible services

// Create S3 client
const s3Client = new S3Client({
  ...(AWS_S3_ENDPOINT && { endpoint: `https://${AWS_S3_ENDPOINT}` }),
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a presigned URL for uploading a file directly to S3
 */
export async function getPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getPresignedDownloadUrl(
  objectKey: string,
  originalFilename: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteObject(objectKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET,
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
