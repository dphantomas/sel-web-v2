import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [50, 75, 80, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  // experimental: {
  //   allowedDevOrigins: ['192.168.1.119', 'localhost:3000'],
  // },
  async rewrites() {
    return [
      {
        source: '/:path((?!es|en|api|_next|assets|favicon.ico|admin).*)',
        destination: '/es/:path*',
      },
      {
        source: '/',
        destination: '/es',
      }
    ];
  },
};

export default nextConfig;
