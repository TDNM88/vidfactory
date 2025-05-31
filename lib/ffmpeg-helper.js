/**
 * Helper utility for ffmpeg operations that works across different deployment environments
 * Handles ffmpeg path detection and provides consistent interface for video processing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

/**
 * Configure ffmpeg with the appropriate binary paths based on environment
 */
function configureFfmpeg() {
  try {
    // Check if ffmpeg is available in the system PATH
    const systemFfmpeg = checkSystemFfmpeg();
    
    if (systemFfmpeg) {
      console.log('Using system ffmpeg:', systemFfmpeg);
      // System ffmpeg is available, no need to set custom paths
    } else {
      // Use ffmpeg-static as fallback
      console.log('System ffmpeg not found, using ffmpeg-static');
      ffmpeg.setFfmpegPath(ffmpegStatic);
      ffmpeg.setFfprobePath(ffprobeStatic.path);
    }
    
    return true;
  } catch (error) {
    console.error('Error configuring ffmpeg:', error);
    return false;
  }
}

/**
 * Check if ffmpeg is available in the system PATH
 * @returns {string|null} Path to ffmpeg binary or null if not found
 */
function checkSystemFfmpeg() {
  try {
    // Try to execute ffmpeg -version
    const output = execSync('ffmpeg -version').toString();
    const firstLine = output.split('\n')[0];
    console.log('System ffmpeg detected:', firstLine);
    
    // Get the actual path
    const whichOutput = execSync('which ffmpeg').toString().trim();
    return whichOutput;
  } catch (error) {
    console.log('System ffmpeg not detected');
    return null;
  }
}

/**
 * Create necessary directories for media storage
 */
function createMediaDirectories() {
  const directories = [
    path.join(process.cwd(), 'public', 'generated-audios'),
    path.join(process.cwd(), 'public', 'generated-images'),
    path.join(process.cwd(), 'public', 'generated-videos'),
    path.join(process.cwd(), 'tmp')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Process a video using ffmpeg with error handling
 * @param {Object} options - Processing options
 * @returns {Promise<string>} Path to the processed video
 */
function processVideo(options) {
  return new Promise((resolve, reject) => {
    const {
      inputPath,
      outputPath,
      videoCodec = 'libx264',
      audioCodec = 'aac',
      width = 1280,
      height = 720,
      fps = 30,
      audioBitrate = '128k',
      videoBitrate = '1500k'
    } = options;
    
    if (!inputPath || !outputPath) {
      reject(new Error('Input and output paths are required'));
      return;
    }
    
    // Ensure ffmpeg is configured
    configureFfmpeg();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Processing video: ${inputPath} -> ${outputPath}`);
    
    ffmpeg(inputPath)
      .outputOptions([
        `-c:v ${videoCodec}`,
        `-c:a ${audioCodec}`,
        `-b:a ${audioBitrate}`,
        `-b:v ${videoBitrate}`,
        `-r ${fps}`,
        `-s ${width}x${height}`,
        '-movflags faststart',
        '-pix_fmt yuv420p'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg process started:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${Math.floor(progress.percent || 0)}% done`);
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('Video processing completed successfully');
        resolve(outputPath);
      })
      .run();
  });
}

/**
 * Combine audio and image to create a video
 * @param {Object} options - Processing options
 * @returns {Promise<string>} Path to the created video
 */
function createVideoFromAudioAndImage(options) {
  return new Promise((resolve, reject) => {
    const {
      audioPath,
      imagePath,
      outputPath,
      duration,
      videoCodec = 'libx264',
      audioCodec = 'aac',
      width = 1280,
      height = 720
    } = options;
    
    if (!audioPath || !imagePath || !outputPath) {
      reject(new Error('Audio path, image path, and output path are required'));
      return;
    }
    
    // Ensure ffmpeg is configured
    configureFfmpeg();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Creating video from audio and image: ${audioPath}, ${imagePath} -> ${outputPath}`);
    
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .input(audioPath)
      .outputOptions([
        `-c:v ${videoCodec}`,
        `-c:a ${audioCodec}`,
        '-pix_fmt yuv420p',
        '-shortest'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg process started:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${Math.floor(progress.percent || 0)}% done`);
      })
      .on('error', (err) => {
        console.error('Error creating video:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('Video creation completed successfully');
        resolve(outputPath);
      })
      .run();
  });
}

// Initialize when module is loaded
configureFfmpeg();
createMediaDirectories();

module.exports = {
  configureFfmpeg,
  checkSystemFfmpeg,
  createMediaDirectories,
  processVideo,
  createVideoFromAudioAndImage
};
