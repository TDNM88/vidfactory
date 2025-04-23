/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add allowedDevOrigins for ngrok
  allowedDevOrigins: [
    'https://*.ngrok-free.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
};

module.exports = nextConfig;
