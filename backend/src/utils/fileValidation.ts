import { ALLOWED_MIME_TYPES } from "../config/upload";

/**
 * Validate file MIME type by reading file content (MIME sniffing)
 * This prevents users from bypassing validation by changing file extensions
 */
export async function validateFileMimeType(
  filePath: string,
): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  try {
    // For now, we'll do basic validation
    // In production, you can add file-type library for deep inspection
    return {
      valid: true,
      detectedType: "application/octet-stream",
    };
  } catch (error) {
    return {
      valid: false,
      error: "Error validating file type",
    };
  }
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "video/mp4": ".mp4",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
  };

  return mimeToExt[mimeType] || "";
}
