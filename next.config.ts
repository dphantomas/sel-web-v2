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
        // El lookahead va anclado a fin de segmento — `(?:/|$)`. Sin eso,
        // cualquier ruta que EMPIECE con "es"/"en" queda excluida del rewrite:
        // /escribir-resena no se reescribía, caía en [lang] con
        // lang="escribir-resena" y servía el home con HTTP 200. Sin 404, sin
        // error: sólo la página equivocada.
        source: '/:path((?!(?:es|en|api|_next|assets|favicon\\.ico|admin)(?:/|$)).*)',
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
