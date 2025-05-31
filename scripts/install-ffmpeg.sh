#!/bin/bash
# TDNM App ffmpeg installation and verification script
# This script installs ffmpeg and verifies it's working correctly
# Compatible with both Azure and Render.com environments

set -e

echo "=== TDNM App ffmpeg Installation ==="
echo "Starting installation at $(date)"
echo "Running as user: $(whoami)"
echo "Current directory: $(pwd)"
echo "System information: $(uname -a)"

# Detect environment
if [ -n "$WEBSITE_SITE_NAME" ]; then
  ENVIRONMENT="Azure"
elif [ -n "$RENDER" ]; then
  ENVIRONMENT="Render"
else
  ENVIRONMENT="Unknown"
fi

echo "Detected environment: $ENVIRONMENT"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to install ffmpeg based on the detected environment
install_ffmpeg() {
  echo "Installing ffmpeg..."
  
  if [ "$ENVIRONMENT" = "Azure" ]; then
    # Azure Web App (Ubuntu-based)
    echo "Installing ffmpeg on Azure (Ubuntu)..."
    apt-get update -y
    apt-get install -y ffmpeg
  elif [ "$ENVIRONMENT" = "Render" ]; then
    # Render.com
    echo "Installing ffmpeg on Render..."
    apt-get update -y
    apt-get install -y ffmpeg
  else
    # Try to detect the package manager and install
    if command_exists apt-get; then
      echo "Detected apt-get, installing ffmpeg..."
      apt-get update -y
      apt-get install -y ffmpeg
    elif command_exists apk; then
      echo "Detected apk (Alpine Linux), installing ffmpeg..."
      apk update
      apk add --no-cache ffmpeg
    elif command_exists yum; then
      echo "Detected yum, installing ffmpeg..."
      yum -y install epel-release
      yum -y install ffmpeg ffmpeg-devel
    else
      echo "ERROR: Could not detect package manager. Please install ffmpeg manually."
      exit 1
    fi
  fi
}

# Function to verify ffmpeg installation
verify_ffmpeg() {
  echo "Verifying ffmpeg installation..."
  
  if command_exists ffmpeg; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo "✅ ffmpeg is installed: $FFMPEG_VERSION"
    echo "ffmpeg location: $(which ffmpeg)"
    
    # Create a test file to verify functionality
    echo "Testing ffmpeg functionality..."
    
    # Create a temporary directory
    TMP_DIR=$(mktemp -d)
    TEST_IMAGE="$TMP_DIR/test.png"
    TEST_AUDIO="$TMP_DIR/test.mp3"
    TEST_OUTPUT="$TMP_DIR/test.mp4"
    
    # Create a simple 100x100 black image (base64 encoded PNG)
    echo "Creating test image..."
    echo "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABLSURBVHhe7cExAQAAAMKg9U9tCU8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbjUAzAABOe9PEwAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"
    
    # Create a simple silent audio file (1 second)
    echo "Creating test audio..."
    ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -q:a 9 -acodec libmp3lame "$TEST_AUDIO" -y >/dev/null 2>&1
    
    # Combine them into a video
    echo "Creating test video..."
    ffmpeg -loop 1 -i "$TEST_IMAGE" -i "$TEST_AUDIO" -c:v libx264 -c:a aac -shortest "$TEST_OUTPUT" -y >/dev/null 2>&1
    
    # Check if output file exists
    if [ -f "$TEST_OUTPUT" ]; then
      echo "✅ ffmpeg functionality test passed!"
      
      # Get file info
      echo "Test video details:"
      ffmpeg -i "$TEST_OUTPUT" 2>&1 | grep -E 'Duration|Stream'
    else
      echo "❌ ffmpeg functionality test failed: Could not create test video"
      exit 1
    fi
    
    # Clean up
    rm -rf "$TMP_DIR"
  else
    echo "❌ ffmpeg is not installed or not in PATH"
    exit 1
  fi
}

# Function to create necessary directories
create_directories() {
  echo "Creating necessary directories..."
  
  # List of directories to create
  DIRS=(
    "public/generated-audios"
    "public/generated-images"
    "public/generated-videos"
    "tmp"
  )
  
  for DIR in "${DIRS[@]}"; do
    if [ ! -d "$DIR" ]; then
      echo "Creating directory: $DIR"
      mkdir -p "$DIR"
      
      # Set permissions
      chmod 755 "$DIR"
    else
      echo "Directory already exists: $DIR"
    fi
  done
  
  echo "✅ Directories created and permissions set"
}

# Main execution
echo "Starting ffmpeg setup..."

# Check if ffmpeg is already installed
if command_exists ffmpeg; then
  echo "ffmpeg is already installed, skipping installation"
  FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
  echo "Current version: $FFMPEG_VERSION"
else
  echo "ffmpeg not found, installing..."
  install_ffmpeg
fi

# Verify the installation
verify_ffmpeg

# Create necessary directories
create_directories

echo "=== ffmpeg setup completed successfully ==="
echo "Installation completed at $(date)"
