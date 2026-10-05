// MOCKED — in-memory @vercel/blob stub (data lost on container sleep)
const blobStore = new Map<
  string,
  {
    url: string
    downloadUrl: string
    pathname: string
    contentType: string
    contentDisposition: string
    size: number
    uploadedAt: Date
    cacheControl: string
  }
>()

export type HandleUploadBody = {
  type: 'blob.generate-client-token' | 'blob.upload-completed'
  payload?: Record<string, unknown>
}

export async function put(
  pathname: string,
  body: Blob | Buffer | ArrayBuffer | string,
  options?: { access?: 'public'; contentType?: string },
) {
  const url = `/mock-blob/${pathname}`
  const size =
    typeof body === 'string'
      ? body.length
      : body instanceof ArrayBuffer
        ? body.byteLength
        : 'size' in body && typeof body.size === 'number'
          ? body.size
          : 'length' in body && typeof body.length === 'number'
            ? body.length
            : 0
  const entry = {
    url,
    downloadUrl: url,
    pathname,
    contentType: options?.contentType || 'application/octet-stream',
    contentDisposition: 'inline',
    size,
    uploadedAt: new Date(),
    cacheControl: 'public, max-age=31536000',
  }
  blobStore.set(url, entry)
  blobStore.set(pathname, entry)
  return entry
}

export async function head(urlOrPathname: string) {
  const existing = blobStore.get(urlOrPathname)
  if (existing) return existing
  return {
    url: urlOrPathname,
    downloadUrl: urlOrPathname,
    pathname: urlOrPathname,
    contentType: 'application/octet-stream',
    contentDisposition: 'inline',
    size: 0,
    uploadedAt: new Date(),
    cacheControl: 'public, max-age=31536000',
  }
}

export async function upload(
  pathname: string,
  file: File | Blob,
  options?: {
    access?: 'public'
    handleUploadUrl?: string
    clientPayload?: string
    contentType?: string
    multipart?: boolean
    onUploadProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  },
) {
  options?.onUploadProgress?.({ loaded: file.size, total: file.size, percentage: 100 })
  const url =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(file)
      : `/mock-blob/${pathname}`
  const entry = {
    url,
    downloadUrl: url,
    pathname,
    contentType: options?.contentType || file.type || 'application/octet-stream',
    contentDisposition: 'inline',
    size: file.size,
    uploadedAt: new Date(),
    cacheControl: 'public, max-age=31536000',
  }
  blobStore.set(url, entry)
  blobStore.set(pathname, entry)
  return entry
}

export async function handleUpload(options: {
  body: HandleUploadBody
  request: Request
  onBeforeGenerateToken: (pathname: string, clientPayload: string | null, multipart: boolean) => Promise<Record<string, unknown>>
  onUploadCompleted?: (input: { blob: Record<string, unknown>; tokenPayload?: string | null }) => Promise<void>
}) {
  if (options.body.type === 'blob.upload-completed') {
    await options.onUploadCompleted?.({ blob: {}, tokenPayload: null })
    return { type: 'blob.upload-completed', response: 'ok' }
  }
  const payload = (options.body.payload ?? {}) as {
    pathname?: string
    clientPayload?: string | null
    multipart?: boolean
  }
  await options.onBeforeGenerateToken(
    payload.pathname ?? '',
    payload.clientPayload ?? null,
    Boolean(payload.multipart),
  )
  return {
    type: 'blob.generate-client-token',
    clientToken: 'mock-client-token',
  }
}
