const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Kiểm tra xem thư mục ffmpeg-bin đã tồn tại chưa
const ffmpegBinDir = path.join(process.cwd(), 'ffmpeg-bin');
const isWin = process.platform === 'win32';
const ffmpegPath = path.join(ffmpegBinDir, isWin ? 'ffmpeg.exe' : 'ffmpeg');
const ffprobePath = path.join(ffmpegBinDir, isWin ? 'ffprobe.exe' : 'ffprobe');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(ffmpegBinDir)) {
  console.log('Creating ffmpeg-bin directory...');
  fs.mkdirSync(ffmpegBinDir, { recursive: true });
}

// Kiểm tra xem ffmpeg đã tồn tại chưa
if (!fs.existsSync(ffmpegPath) || !fs.existsSync(ffprobePath)) {
  console.log('FFmpeg binaries not found. Installing...');
  
  try {
    // Sử dụng npm để cài đặt ffmpeg-static và ffprobe-static
    console.log('Installing ffmpeg-static and ffprobe-static...');
    execSync('npm install ffmpeg-static ffprobe-static', { stdio: 'inherit' });
    
    // Lấy đường dẫn từ các package
    const ffmpegStaticPath = require('ffmpeg-static');
    const ffprobeStaticPath = require('ffprobe-static').path;
    
    // Copy các file binary vào thư mục ffmpeg-bin
    console.log(`Copying FFmpeg from ${ffmpegStaticPath} to ${ffmpegPath}`);
    fs.copyFileSync(ffmpegStaticPath, ffmpegPath);
    
    console.log(`Copying FFprobe from ${ffprobeStaticPath} to ${ffprobePath}`);
    fs.copyFileSync(ffprobeStaticPath, ffprobePath);
    
    console.log('FFmpeg binaries installed successfully!');
  } catch (error) {
    console.error('Error installing FFmpeg binaries:', error);
    process.exit(1);
  }
} else {
  console.log('FFmpeg binaries already exist.');
}

console.log('FFmpeg setup complete!');
