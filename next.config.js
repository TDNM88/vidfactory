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
    'http://127.0.0.1:3000',
    'http://192.168.1.4:3000',
    'http://192.168.1.4'
  ],
};

module.exports = nextConfig;
