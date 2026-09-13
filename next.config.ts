import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/",
        permanent: true,
      },
      {
        source: "/how-we-work",
        destination: "/",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/",
        permanent: true,
      },
      {
        source: "/projects/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/services/:path*",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

