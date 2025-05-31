/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Thêm cấu hình để đảm bảo các biến môi trường được chuyển đến API routes
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    TENSOR_API_KEY: process.env.TENSOR_API_KEY,
    TENSOR_API_URL: process.env.TENSOR_API_URL,
    HF_TOKEN: process.env.HF_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    VIDU_API_KEY: process.env.VIDU_API_KEY,
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Add allowedDevOrigins for ngrok
  allowedDevOrigins: [
    'https://*.ngrok-free.app',
    'http://localhost:3000',
    'https://4b11-42-116-202-113.ngrok-free.app',
    'http://127.0.0.1:*',  // Sử dụng wildcard cho tất cả các port từ 127.0.0.1
    'http://192.168.1.4:3000',
    'http://127.0.0.1:57592'
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
