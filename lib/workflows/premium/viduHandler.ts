import { NextRequest } from 'next/server';

export async function handleViduRequest(req: NextRequest) {
  // Thêm logic xử lý Vidu
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 