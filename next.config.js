/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add allowedDevOrigins for ngrok
  allowedDevOrigins: [
    'https://*.ngrok-free.app',
    'http://localhost:3000',
    'https://4b11-42-116-202-113.ngrok-free.app',
    'http://127.0.0.1:3000'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
      },
    ],
  },
};

module.exports = nextConfig;
