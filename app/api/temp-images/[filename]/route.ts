// File: app/api/temp-images/[filename]/route.ts
import { NextResponse } from 'next/server';
import * as fs from 'node:fs/promises';
import path from 'path';

const TEMP_IMAGE_DIR = '/tmp/generated-images';
const STATIC_IMAGE_DIR = path.join(process.cwd(), 'public', 'generated-images');
const ROOT_IMAGE_DIR = path.join(process.cwd(), 'generated-images'); // fallback for local dev

/**
 * Serve image from ANY possible location: /tmp/generated-images, public/generated-images, or generated-images.
 * This ensures images are always accessible regardless of runtime or deployment.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Validate filename - basic check for .png extension
  if (!filename.match(/^image-[^/]+\.png$/)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid filename' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Try all possible locations for the image
  const locations = [
    path.join(TEMP_IMAGE_DIR, filename),
    path.join(STATIC_IMAGE_DIR, filename),
    path.join(ROOT_IMAGE_DIR, filename),
  ];

  let foundPath: string | null = null;
  for (const loc of locations) {
    try {
      await fs.access(loc);
      foundPath = loc;
      break;
    } catch {}
  }

  if (!foundPath) {
    return new NextResponse(
      JSON.stringify({
        error: 'Image not found. Ensure the image is saved in /tmp/generated-images, public/generated-images, or generated-images.',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const imageBuffer = await fs.readFile(foundPath);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to serve image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
