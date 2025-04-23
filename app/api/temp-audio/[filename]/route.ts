import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params;
    const filePath = join(tmpdir(), filename);

    const fileStream = createReadStream(filePath);
    const { size } = statSync(filePath);

    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg', // Changed to audio/mpeg
        'Content-Length': size.toString(),
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse(null, { status: 404 });
    }
    console.error('Error serving audio:', error);
    return new NextResponse(null, { status: 500 });
  }
}