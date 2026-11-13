export const DIRECT_BLOB_UPLOAD_MAX_BYTES = 20 * 1024 * 1024
export const CAD_BUCKET_UPLOAD_MAX_BYTES = 200 * 1024 * 1024
export const CAD_WORK_UPLOAD_MAX_BYTES = CAD_BUCKET_UPLOAD_MAX_BYTES
export const VISUALIZER_WORK_UPLOAD_MAX_BYTES = 500 * 1024 * 1024

export function formatBytesToMbLabel(sizeBytes: number): string {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`
}

export const DIRECT_BLOB_UPLOAD_LIMIT_MESSAGE = `Files upload directly from your browser to Vercel Blob and can be up to ${formatBytesToMbLabel(DIRECT_BLOB_UPLOAD_MAX_BYTES)} each.`
export const CAD_BUCKET_UPLOAD_LIMIT_MESSAGE = `CAD files upload directly from your browser to Vercel Blob and can be up to ${formatBytesToMbLabel(CAD_BUCKET_UPLOAD_MAX_BYTES)} each.`
export const VISUALIZER_WORK_UPLOAD_LIMIT_MESSAGE = `3D Visualizer submissions upload directly from your browser to Vercel Blob and can be up to ${formatBytesToMbLabel(VISUALIZER_WORK_UPLOAD_MAX_BYTES)} each.`
