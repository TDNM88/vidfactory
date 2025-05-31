import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import { configureFfmpeg, checkSystemFfmpeg } from '../../lib/ffmpeg-helper';

type ResponseData = {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed', error: 'Only GET requests are allowed' });
  }

  try {
    // Create a test results object
    const testResults = {
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      nodejs: process.version,
      tests: {} as Record<string, any>
    };

    // Test 1: Check if ffmpeg is installed
    try {
      const ffmpegPath = checkSystemFfmpeg();
      if (ffmpegPath) {
        const ffmpegVersion = execSync('ffmpeg -version').toString().split('\n')[0];
        testResults.tests.ffmpeg = {
          success: true,
          path: ffmpegPath,
          version: ffmpegVersion
        };
      } else {
        testResults.tests.ffmpeg = {
          success: false,
          message: 'ffmpeg not found in system PATH'
        };
      }
    } catch (error: any) {
      testResults.tests.ffmpeg = {
        success: false,
        error: error.message
      };
    }

    // Test 2: Check if directories exist and are writable
    const directories = [
      { name: 'public/generated-audios', path: path.join(process.cwd(), 'public', 'generated-audios') },
      { name: 'public/generated-images', path: path.join(process.cwd(), 'public', 'generated-images') },
      { name: 'public/generated-videos', path: path.join(process.cwd(), 'public', 'generated-videos') }
    ];

    testResults.tests.directories = {};
    
    for (const dir of directories) {
      try {
        // Check if directory exists
        const exists = fs.existsSync(dir.path);
        
        if (!exists) {
          // Try to create it
          fs.mkdirSync(dir.path, { recursive: true });
        }
        
        // Test write access by creating a test file
        const testFilePath = path.join(dir.path, `test-${uuidv4()}.txt`);
        fs.writeFileSync(testFilePath, 'Test file for deployment verification');
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        
        testResults.tests.directories[dir.name] = {
          success: true,
          path: dir.path,
          exists: exists,
          writable: true
        };
      } catch (error: any) {
        testResults.tests.directories[dir.name] = {
          success: false,
          path: dir.path,
          error: error.message
        };
      }
    }

    // Test 3: Check environment variables
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'OPENROUTER_API_KEY',
      'TENSOR_API_URL',
      'TENSOR_API_KEY',
      'HF_TOKEN',
      'GEMINI_API_KEY',
      'VIDU_API_KEY',
      'PEXELS_API_KEY',
      'GROQ_API_KEY'
    ];

    testResults.tests.environmentVariables = {};
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      testResults.tests.environmentVariables[envVar] = {
        success: !!value,
        exists: !!value,
        // Only show first few characters for security
        value: value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : undefined
      };
    }

    // Test 4: Simple ffmpeg operation test
    try {
      // Create a test image
      const testImagePath = path.join(process.cwd(), 'tmp', `test-${uuidv4()}.png`);
      const testAudioPath = path.join(process.cwd(), 'tmp', `test-${uuidv4()}.mp3`);
      const testOutputPath = path.join(process.cwd(), 'tmp', `test-${uuidv4()}.mp4`);
      
      // Create a simple 100x100 black image
      const imageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABLSURBVHhe7cExAQAAAMKg9U9tCU8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbjUAzAABOe9PEwAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, imageData);
      
      // Create a simple silent audio file (1 second)
      const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -q:a 9 -acodec libmp3lame ${testAudioPath}`;
      execSync(command);
      
      // Combine them into a video
      const ffmpegCommand = `ffmpeg -loop 1 -i ${testImagePath} -i ${testAudioPath} -c:v libx264 -c:a aac -shortest ${testOutputPath}`;
      execSync(ffmpegCommand);
      
      // Check if output file exists
      const outputExists = fs.existsSync(testOutputPath);
      
      // Clean up test files
      if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
      if (fs.existsSync(testAudioPath)) fs.unlinkSync(testAudioPath);
      if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
      
      testResults.tests.ffmpegOperation = {
        success: outputExists,
        message: outputExists ? 'Successfully created test video' : 'Failed to create test video'
      };
    } catch (error: any) {
      testResults.tests.ffmpegOperation = {
        success: false,
        error: error.message
      };
    }

    // Return test results
    return res.status(200).json({
      success: true,
      message: 'Deployment test completed',
      details: testResults
    });
  } catch (error: any) {
    console.error('Error in deployment test:', error);
    return res.status(500).json({
      success: false,
      message: 'Deployment test failed',
      error: error.message
    });
  }
}
