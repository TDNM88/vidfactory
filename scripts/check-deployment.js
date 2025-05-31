/**
 * TDNM App Deployment Verification Tool
 * 
 * This script checks the deployment status of your TDNM application on Render.com
 * It verifies:
 * - Application health
 * - ffmpeg installation and functionality
 * - Directory structure and permissions
 * - Environment variables
 * - Video processing capabilities
 * 
 * Usage:
 *   node check-deployment.js --url=https://your-deployed-app-url.com
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) {
    acc[key.replace(/^--/, '')] = value;
  }
  return acc;
}, {});

// Configuration
const config = {
  // Default to localhost if no URL is provided
  baseUrl: args.url || process.env.VERIFY_URL || 'http://localhost:3000',
  // Endpoints to test
  endpoints: [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/deployment-test', method: 'GET', name: 'Deployment Test' }
  ],
  // Timeout in milliseconds
  timeout: 30000
};

/**
 * Make an HTTP request to the specified URL
 * @param {string} url - The URL to request
 * @param {string} method - The HTTP method to use
 * @returns {Promise<Object>} - The response data
 */
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'TDNM-Deployment-Verification/1.0'
      }
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            error: 'Failed to parse JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });
    
    req.end();
  });
}

/**
 * Detect the deployment platform based on the URL
 * @param {string} url - The deployment URL
 * @returns {string} - The detected platform
 */
function detectPlatform(url) {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname.includes('onrender.com')) {
    return 'Render.com';
  } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'Local';
  } else {
    return 'Unknown';
  }
}

/**
 * Print a colored message to the console
 * @param {string} message - The message to print
 * @param {string} type - The type of message (success, error, info, warning)
 */
function printMessage(message, type = 'info') {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    info: '\x1b[36m',    // Cyan
    warning: '\x1b[33m'  // Yellow
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

/**
 * Run all verification tests
 */
async function runVerification() {
  const platform = detectPlatform(config.baseUrl);
  
  console.log(`\n${'-'.repeat(60)}`);
  printMessage(`TDNM App Deployment Verification`, 'info');
  console.log(`${'-'.repeat(60)}`);
  printMessage(`Base URL: ${config.baseUrl}`, 'info');
  printMessage(`Detected Platform: ${platform}`, 'info');
  printMessage(`Time: ${new Date().toISOString()}`, 'info');
  console.log(`${'-'.repeat(60)}\n`);
  
  let allTestsPassed = true;
  
  for (const endpoint of config.endpoints) {
    const url = `${config.baseUrl}${endpoint.path}`;
    printMessage(`Testing ${endpoint.name}: ${url}`, 'info');
    
    try {
      const response = await makeRequest(url, endpoint.method);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        printMessage(`${endpoint.name}: Success (${response.statusCode})`, 'success');
        
        if (endpoint.path === '/api/health') {
          // Print health check details
          console.log('\n--- Health Check Details ---');
          if (response.data.status === 'ok') {
            printMessage('Application Status: Running', 'success');
          } else {
            printMessage(`Application Status: ${response.data.status}`, 'warning');
          }
          
          if (response.data.system) {
            const system = response.data.system;
            console.log(`Node.js: ${system.nodejs}`);
            console.log(`Platform: ${system.platform}`);
            console.log(`Memory: ${Math.round(system.memory.used / 1024 / 1024)}MB used of ${Math.round(system.memory.total / 1024 / 1024)}MB total`);
            console.log(`Uptime: ${Math.round(system.uptime / 60)} minutes`);
          }
          
          if (response.data.ffmpeg) {
            const ffmpeg = response.data.ffmpeg;
            if (ffmpeg.installed) {
              printMessage(`FFmpeg: Installed (${ffmpeg.version})`, 'success');
              console.log(`Path: ${ffmpeg.path}`);
            } else {
              printMessage(`FFmpeg: Not installed`, 'error');
              allTestsPassed = false;
            }
          }
          
          console.log('---------------------------\n');
        }
        
        if (endpoint.path === '/api/deployment-test') {
          // Print detailed results for deployment test
          console.log('\n--- Deployment Test Details ---');
          
          if (response.data.success) {
            printMessage('Overall Deployment Test: Passed', 'success');
          } else {
            printMessage('Overall Deployment Test: Failed', 'error');
            allTestsPassed = false;
          }
          
          if (response.data.details) {
            const details = response.data.details;
            
            // Environment info
            console.log(`\nEnvironment: ${details.environment}`);
            console.log(`Platform: ${details.platform}`);
            console.log(`Node.js: ${details.nodejs}`);
            
            // FFmpeg test
            if (details.tests.ffmpeg) {
              console.log('\nFFmpeg Installation:');
              const ffmpegTest = details.tests.ffmpeg;
              if (ffmpegTest.success) {
                printMessage(`FFmpeg: Installed at ${ffmpegTest.path}`, 'success');
                console.log(`Version: ${ffmpegTest.version}`);
              } else {
                printMessage(`FFmpeg: Not installed or not found in PATH`, 'error');
                console.log(`Error: ${ffmpegTest.error || ffmpegTest.message}`);
                allTestsPassed = false;
              }
            }
            
            // Directories test
            if (details.tests.directories) {
              console.log('\nDirectory Access:');
              for (const [dirName, dirResult] of Object.entries(details.tests.directories)) {
                if (dirResult.success) {
                  printMessage(`${dirName}: Exists and writable`, 'success');
                } else {
                  printMessage(`${dirName}: ${dirResult.error}`, 'error');
                  allTestsPassed = false;
                }
              }
            }
            
            // Environment variables test
            if (details.tests.environmentVariables) {
              console.log('\nEnvironment Variables:');
              for (const [envName, envResult] of Object.entries(details.tests.environmentVariables)) {
                if (envResult.success) {
                  printMessage(`${envName}: Configured`, 'success');
                } else {
                  printMessage(`${envName}: Missing`, 'warning');
                  // Don't fail the test for missing env vars, just warn
                }
              }
            }
            
            // FFmpeg operation test
            if (details.tests.ffmpegOperation) {
              console.log('\nFFmpeg Operation Test:');
              const opTest = details.tests.ffmpegOperation;
              if (opTest.success) {
                printMessage(`Test Video Creation: ${opTest.message}`, 'success');
                if (opTest.outputPath) {
                  console.log(`Output: ${opTest.outputPath}`);
                }
              } else {
                printMessage(`Test Video Creation: Failed`, 'error');
                console.log(`Error: ${opTest.error}`);
                allTestsPassed = false;
              }
            }
          }
          
          console.log('-------------------------------\n');
        }
      } else {
        printMessage(`${endpoint.name}: Failed (${response.statusCode})`, 'error');
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        allTestsPassed = false;
      }
    } catch (error) {
      printMessage(`${endpoint.name}: Error - ${error.message}`, 'error');
      allTestsPassed = false;
    }
    
    console.log(''); // Add a blank line between tests
  }
  
  // Final summary
  console.log(`${'-'.repeat(60)}`);
  printMessage('Verification Summary', 'info');
  console.log(`${'-'.repeat(60)}`);
  if (allTestsPassed) {
    printMessage('All tests passed! Your deployment appears to be working correctly.', 'success');
    
    // Platform-specific recommendations
    if (platform === 'Render.com') {
      console.log('\nRender.com Deployment Recommendations:');
      console.log('1. Monitor your disk usage (1GB limit on free tier)');
      console.log('2. Check Render logs for any warnings or errors');
      console.log('3. Consider setting up a custom domain if you upgrade to a paid tier');
    }
    
    console.log('\nNext Steps:');
    console.log('1. Test the application with real users');
    console.log('2. Set up monitoring and alerting');
    console.log('3. Consider implementing a CI/CD pipeline for automated deployments');
  } else {
    printMessage('Some tests failed. Please check the details above and fix any issues.', 'error');
    
    // Troubleshooting tips
    console.log('\nTroubleshooting Tips:');
    console.log('1. Check the application logs for errors');
    console.log('2. Verify that ffmpeg is installed and in the PATH');
    console.log('3. Ensure all required directories exist and are writable');
    console.log('4. Confirm all environment variables are set correctly');
    console.log('5. Restart the application after making changes');
    
    if (platform === 'Render.com') {
      console.log('\nRender.com-Specific Troubleshooting:');
      console.log('1. Check the Render dashboard for logs and errors');
      console.log('2. Verify that the render-build.sh and start.sh scripts are being executed');
      console.log('3. Check if the disk is full or if you\'re hitting resource limits');
    }
  }
  console.log(`${'-'.repeat(60)}\n`);
}

// Run the verification
runVerification().catch(error => {
  printMessage(`Verification failed with error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
