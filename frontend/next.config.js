/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para o Dockerfile (stage runner usa node server.js standalone)
  output: 'standalone',


  // Proxy: redireciona /api/* para o backend (resolve problema de cookie cross-origin em dev e produção)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'https://vincelo-production.up.railway.app';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Uploads locais em desenvolvimento
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // S3 (produção) — ajustar bucket name conforme env
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      // CloudFront CDN (opcional)
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
    ],
    // Formatos modernos para melhor compressão
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de segurança adicionais
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
