export const siteName = "INTERIOR CONCEPT Studio"

export const siteUrl = "https://www.aestheticinteriorbd.com"

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}
