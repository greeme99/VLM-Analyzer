import { getStorage } from "./firebase";
import * as admin from "firebase-admin";

/**
 * Firebase Storage Helper Functions
 * Handles video and report file uploads/downloads
 */

/**
 * Upload video file to Firebase Storage
 * @param fileBuffer - File content as Buffer
 * @param fileName - Original file name
 * @param contentType - MIME type
 * @returns Object with storage path and public URL
 */
export async function uploadVideoToStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ path: string; url: string; key: string }> {
  const storage = await getStorage();
  
  // Generate unique file key
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const fileKey = `videos/${timestamp}-${randomId}-${fileName}`;
  
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make file public
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileKey}`;

    console.log(`[Firebase Storage] Video uploaded: ${fileKey}`);

    return {
      path: fileKey,
      url: publicUrl,
      key: fileKey,
    };
  } catch (error) {
    console.error("[Firebase Storage] Video upload failed:", error);
    throw error;
  }
}

/**
 * Upload report file to Firebase Storage
 * @param fileBuffer - File content as Buffer
 * @param reportType - Type of report (pdf, excel, csv, html)
 * @param projectId - Project ID for organization
 * @returns Object with storage path and public URL
 */
export async function uploadReportToStorage(
  fileBuffer: Buffer,
  reportType: string,
  projectId: number,
  contentType: string
): Promise<{ path: string; url: string; key: string }> {
  const storage = await getStorage();
  
  // Generate unique file key
  const timestamp = Date.now();
  const fileExtension = reportType === "excel" ? "xlsx" : reportType;
  const fileKey = `reports/${projectId}/report-${timestamp}.${fileExtension}`;
  
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make file public
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileKey}`;

    console.log(`[Firebase Storage] Report uploaded: ${fileKey}`);

    return {
      path: fileKey,
      url: publicUrl,
      key: fileKey,
    };
  } catch (error) {
    console.error("[Firebase Storage] Report upload failed:", error);
    throw error;
  }
}

/**
 * Download file from Firebase Storage
 * @param fileKey - Storage file key/path
 * @returns File content as Buffer
 */
export async function downloadFromStorage(fileKey: string): Promise<Buffer> {
  const storage = await getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    const [buffer] = await file.download();
    console.log(`[Firebase Storage] File downloaded: ${fileKey}`);
    return buffer;
  } catch (error) {
    console.error("[Firebase Storage] File download failed:", error);
    throw error;
  }
}

/**
 * Get signed URL for temporary access
 * @param fileKey - Storage file key/path
 * @param expiresIn - Expiration time in milliseconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  fileKey: string,
  expiresIn: number = 3600000
): Promise<string> {
  const storage = await getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresIn,
    });

    console.log(`[Firebase Storage] Signed URL generated for: ${fileKey}`);
    return url;
  } catch (error) {
    console.error("[Firebase Storage] Signed URL generation failed:", error);
    throw error;
  }
}

/**
 * Delete file from Firebase Storage
 * @param fileKey - Storage file key/path
 */
export async function deleteFromStorage(fileKey: string): Promise<void> {
  const storage = await getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    await file.delete();
    console.log(`[Firebase Storage] File deleted: ${fileKey}`);
  } catch (error) {
    console.error("[Firebase Storage] File deletion failed:", error);
    throw error;
  }
}

/**
 * Check if file exists in Firebase Storage
 * @param fileKey - Storage file key/path
 * @returns Boolean indicating if file exists
 */
export async function fileExists(fileKey: string): Promise<boolean> {
  const storage = await getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error("[Firebase Storage] File existence check failed:", error);
    return false;
  }
}

/**
 * Get file metadata from Firebase Storage
 * @param fileKey - Storage file key/path
 * @returns File metadata
 */
export async function getFileMetadata(fileKey: string): Promise<any> {
  const storage = await getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(fileKey);
  
  try {
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error("[Firebase Storage] Metadata retrieval failed:", error);
    throw error;
  }
}

export default {
  uploadVideoToStorage,
  uploadReportToStorage,
  downloadFromStorage,
  getSignedUrl,
  deleteFromStorage,
  fileExists,
  getFileMetadata,
};
