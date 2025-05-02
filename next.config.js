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
    'http://192.168.1.4:3000'
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
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
      {
        protocol: 'https',
        hostname: 'v.pexels.com',
      },
      // Thêm domain của Netlify cho images
      {
        protocol: 'https',
        hostname: 'poetic-parfait-992f0d.netlify.app',
      },
    ],
  },
  // Loại bỏ cấu hình không hoạt động
  // output: 'standalone',
  // distDir: '.next',
};

module.exports = nextConfig;
