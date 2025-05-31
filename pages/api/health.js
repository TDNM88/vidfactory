// Enhanced health check endpoint for Azure, Render.com and other hosting platforms
import { execSync } from 'child_process';
import os from 'os';

export default function handler(req, res) {
  // Basic health information
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodejs: process.version,
    platform: process.platform,
    memory: {
      total: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
      free: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
      usage: `${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)}%`
    },
    uptime: `${Math.round(process.uptime())} seconds`
  };

  // Check if ffmpeg is installed
  try {
    const ffmpegVersion = execSync('ffmpeg -version').toString().split('\n')[0];
    healthInfo.ffmpeg = {
      installed: true,
      version: ffmpegVersion
    };
  } catch (error) {
    healthInfo.ffmpeg = {
      installed: false,
      error: error.message
    };
  }

  // Return health information
  res.status(200).json(healthInfo);
}
