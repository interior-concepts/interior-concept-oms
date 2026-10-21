import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  context: { params: { path: string[] } | Promise<{ path: string[] }> },
) {
  const resolvedParams = await context.params
  const path = resolvedParams?.path ?? []
  const fileName = path[path.length - 1] ?? 'File'
  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName)

  if (isImage) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <rect width="600" height="340" rx="12" fill="#0f172a"/>
  <rect x="20" y="20" width="560" height="300" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <circle cx="300" cy="110" r="32" fill="#334155"/>
  <path d="M288 122l8-10 6 7 10-13 12 16H288z" fill="#94a3b8"/>
  <circle cx="295" cy="100" r="3" fill="#94a3b8"/>
  <text x="300" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="600" fill="#f8fafc" text-anchor="middle">Image Not Available</text>
  <text x="300" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">This file was uploaded during development preview mode.</text>
  <text x="300" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#38bdf8" text-anchor="middle">Please re-upload this file in the CRM.</text>
</svg>`
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>File Not Available - Interior Concepts CRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      max-width: 440px;
      text-align: center;
    }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px; }
    .badge {
      display: inline-block;
      background: #0284c7;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>File Not Available</h1>
    <p>This file (<strong>${fileName}</strong>) was uploaded during development preview mode and could not be permanently stored.<br><br>Please re-upload this file in the CRM.</p>
    <a href="javascript:window.close()" class="badge">Close Window</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
