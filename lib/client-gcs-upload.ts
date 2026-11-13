import { uploadDirectBlobFile, type UploadedBlobFileMeta } from '@/lib/client-blob-upload'

export type ClientGCSUploadContext =
  | 'cad-work'
  | 'quotation-work'
  | 'visualizer-work'
  | 'visit-result'
  | 'visit-support-result'
  | 'lead-attachment'
  | 'transaction-receipt'
  | 'website-project'
  | 'website-team'
  | 'website-testimonial'

export type UploadedGCSFileMeta = UploadedBlobFileMeta

export async function uploadDirectGCSFile(input: {
  file: File
  context: any
  ownerId: string
  cadFileType?: string
  quotationFileType?: any
  onProgress?: (percentage: number) => void
}): Promise<UploadedGCSFileMeta> {
  return uploadDirectBlobFile(input as any)
}
