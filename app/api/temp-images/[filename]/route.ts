// File: app/api/temp-images/[filename]/route.ts
import { NextResponse } from 'next/server';
import * as fs from 'node:fs/promises';
import path from 'path';

const TEMP_IMAGE_DIR = '/tmp/generated-images';

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Validate filename - basic check for .png extension
  if (!filename.match(/^image-[^/]+\.png$/)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid filename' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const imagePath = path.join(TEMP_IMAGE_DIR, filename);

  try {
    // Check if the file exists
    await fs.access(imagePath);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Image not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Read the image data
    const imageBuffer = await fs.readFile(imagePath);

    // Return the image as a response
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving temporary image:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to serve image' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
