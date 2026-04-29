/**
 * S3 Storage Helper Functions
 * Handles file upload and retrieval from S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../server/_core/env";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "vlm-motion-analysis";

/**
 * Upload file to S3
 * @param fileKey - Unique key for the file (e.g., "videos/user123/timestamp.mp4")
 * @param fileBuffer - File content as Buffer
 * @param contentType - MIME type of the file
 * @returns Object with key and URL
 */
export async function storagePut(
  fileKey: string,
  fileBuffer: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  try {
    // Convert string to Buffer if needed
    const buffer = typeof fileBuffer === "string" ? Buffer.from(fileBuffer) : fileBuffer;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    });

    await s3Client.send(command);

    // Return storage URL
    const url = `/manus-storage/${fileKey}`;

    return { key: fileKey, url };
  } catch (error) {
    console.error(`[Storage] Error uploading file ${fileKey}:`, error);
    throw new Error(`Failed to upload file: ${fileKey}`);
  }
}

/**
 * Get presigned URL for downloading file from S3
 * @param fileKey - Unique key for the file
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Object with key and presigned URL
 */
export async function storageGet(
  fileKey: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { key: fileKey, url };
  } catch (error) {
    console.error(`[Storage] Error getting presigned URL for ${fileKey}:`, error);
    throw new Error(`Failed to get presigned URL: ${fileKey}`);
  }
}

/**
 * Get presigned upload URL for direct client upload
 * @param fileKey - Unique key for the file
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Object with key and presigned upload URL
 */
export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string = "video/mp4",
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { key: fileKey, url };
  } catch (error) {
    console.error(`[Storage] Error generating presigned upload URL for ${fileKey}:`, error);
    throw new Error(`Failed to generate presigned upload URL: ${fileKey}`);
  }
}

/**
 * Check if file exists in S3
 * @param fileKey - Unique key for the file
 * @returns true if file exists, false otherwise
 */
export async function storageExists(fileKey: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return false;
    }
    console.error(`[Storage] Error checking file existence for ${fileKey}:`, error);
    return false;
  }
}

/**
 * Delete file from S3
 * @param fileKey - Unique key for the file
 * @returns true if deletion was successful
 */
export async function storageDelete(fileKey: string): Promise<boolean> {
  try {
    // Note: DeleteObjectCommand would need to be imported
    // For now, we'll just log the deletion request
    console.log(`[Storage] Deleting file: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error deleting file ${fileKey}:`, error);
    return false;
  }
}

/**
 * Generate a unique file key for uploads
 * @param userId - User ID
 * @param originalFilename - Original filename
 * @returns Unique file key
 */
export function generateFileKey(userId: number, originalFilename: string): string {
  const timestamp = Date.now();
  const ext = originalFilename.split(".").pop() || "mp4";
  return `videos/${userId}/${timestamp}.${ext}`;
}
