/**
 * Deployment verification script for TDNM App
 * Run this script after deploying to verify that the environment is correctly set up
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  // Set your deployed application URL here
  baseUrl: process.env.VERIFY_URL || 'http://localhost:3000',
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
 * Run all verification tests
 */
async function runVerification() {
  console.log(`\n=== TDNM App Deployment Verification ===`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`===========================================\n`);
  
  let allTestsPassed = true;
  
  for (const endpoint of config.endpoints) {
    const url = `${config.baseUrl}${endpoint.path}`;
    console.log(`Testing ${endpoint.name}: ${url}`);
    
    try {
      const response = await makeRequest(url, endpoint.method);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`✅ ${endpoint.name}: Success (${response.statusCode})`);
        
        if (endpoint.path === '/api/deployment-test') {
          // Print detailed results for deployment test
          console.log('\n--- Deployment Test Details ---');
          
          if (response.data.details) {
            const details = response.data.details;
            
            // Environment info
            console.log(`Environment: ${details.environment}`);
            console.log(`Platform: ${details.platform}`);
            console.log(`Node.js: ${details.nodejs}`);
            
            // FFmpeg test
            if (details.tests.ffmpeg) {
              const ffmpegTest = details.tests.ffmpeg;
              if (ffmpegTest.success) {
                console.log(`✅ FFmpeg: Installed at ${ffmpegTest.path}`);
                console.log(`   Version: ${ffmpegTest.version}`);
              } else {
                console.log(`❌ FFmpeg: Not installed or not found in PATH`);
                console.log(`   Error: ${ffmpegTest.error || ffmpegTest.message}`);
                allTestsPassed = false;
              }
            }
            
            // Directories test
            if (details.tests.directories) {
              console.log('\nDirectory Access:');
              for (const [dirName, dirResult] of Object.entries(details.tests.directories)) {
                if (dirResult.success) {
                  console.log(`✅ ${dirName}: Exists and writable`);
                } else {
                  console.log(`❌ ${dirName}: ${dirResult.error}`);
                  allTestsPassed = false;
                }
              }
            }
            
            // Environment variables test
            if (details.tests.environmentVariables) {
              console.log('\nEnvironment Variables:');
              for (const [envName, envResult] of Object.entries(details.tests.environmentVariables)) {
                if (envResult.success) {
                  console.log(`✅ ${envName}: Configured`);
                } else {
                  console.log(`❌ ${envName}: Missing`);
                  allTestsPassed = false;
                }
              }
            }
            
            // FFmpeg operation test
            if (details.tests.ffmpegOperation) {
              const opTest = details.tests.ffmpegOperation;
              if (opTest.success) {
                console.log(`\n✅ FFmpeg Operation: ${opTest.message}`);
              } else {
                console.log(`\n❌ FFmpeg Operation: Failed`);
                console.log(`   Error: ${opTest.error}`);
                allTestsPassed = false;
              }
            }
          }
          
          console.log('-------------------------------\n');
        }
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.statusCode})`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      allTestsPassed = false;
    }
    
    console.log(''); // Add a blank line between tests
  }
  
  // Final summary
  console.log('=== Verification Summary ===');
  if (allTestsPassed) {
    console.log('✅ All tests passed! Your deployment appears to be working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the details above and fix any issues.');
  }
  console.log('=============================\n');
}

// Run the verification
runVerification().catch(error => {
  console.error('Verification failed with error:', error);
  process.exit(1);
});
