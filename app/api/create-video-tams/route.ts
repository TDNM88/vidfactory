import { NextResponse } from "next/server";

const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "809397844309168055";

// --- Hàm upload ảnh lên TensorArt, trả về resourceId ---
async function uploadImageToTensorArt(imageData: string): Promise<string> {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('imageData is required and must be a string');
  }
  const apiKey = process.env.TENSOR_ART_API_KEY;
  if (!apiKey) throw new Error("TENSOR_ART_API_KEY is not defined");

  // Chuẩn bị buffer ảnh
  let imageBlob: Blob;
  if (imageData.startsWith('http')) {
    imageBlob = await fetch(imageData).then(res => res.blob());
  } else {
    // base64
    const base64 = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    imageBlob = new Blob([buffer]);
  }
  // 1. Tạo resource mới
  const resourceRes = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ expireSec: 7200 }),
  });
  const resourceResponse = await resourceRes.json();
  const putUrl = resourceResponse.putUrl as string;
  const resourceId = resourceResponse.resourceId as string;
  const putHeaders = (resourceResponse.headers as Record<string, string>) || { 'Content-Type': 'image/png' };
  if (!putUrl || !resourceId) {
    throw new Error(`Invalid response: ${JSON.stringify(resourceResponse)}`);
  }
  // 2. Upload ảnh thực tế
  const putResponse = await fetch(putUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: imageBlob,
  });
  if (![200, 203].includes(putResponse.status)) {
    throw new Error(`PUT failed: ${putResponse.status} - ${await putResponse.text()}`);
  }
  // Đợi 8s để đảm bảo ảnh được upload thành công
  await new Promise((resolve) => setTimeout(resolve, 8000));
  return resourceId;
}

// --- Hàm chọn resolution đúng chuẩn nền tảng ---
function pickResolution(w?: number, h?: number): string {
  if (!w || !h) return "1:1 [1024x1024 square]";
  const ratio = w / h;
  if (Math.abs(ratio - 1) < 0.1) return "1:1 [1024x1024 square]";
  if (Math.abs(ratio - 9/16) < 0.1) return "9:16 [720x1280 portrait]";
  if (Math.abs(ratio - 16/9) < 0.1) return "16:9 [1280x720 landscape]";
  if (Math.abs(ratio - 2/3) < 0.1) return "2:3 [800x1200 portrait]";
  if (Math.abs(ratio - 3/2) < 0.1) return "3:2 [1200x800 landscape]";
  return "1:1 [1024x1024 square]";
}

// --- Hàm tạo job TAMS ---
async function createTAMSJob(resourceId: string, resolution: string): Promise<string> {
  const apiKey = process.env.TENSOR_ART_API_KEY;
  if (!apiKey) throw new Error("TENSOR_ART_API_KEY is not defined");
  const url = `${TENSOR_ART_API_URL}/jobs/workflow/template`;
  const workflowData = {
    request_id: Date.now().toString(),
    templateId: WORKFLOW_TEMPLATE_ID,
    fields: {
      fieldAttrs: [
        {
          nodeId: "27",
          fieldName: "image",
          fieldValue: resourceId,
          nodeName: "TensorArt_LoadImage",
          inputString: JSON.stringify([
            {
              name: "image",
              type: "combo",
              value: resourceId,
              options: { values: [resourceId] }
            },
            { name: "upload", type: "button", value: "image", options: {} }
          ])
        },
        {
          nodeId: "28",
          fieldName: "size_selected",
          fieldValue: resolution,
          nodeName: "TensorArt_SelectResolution",
          inputString: JSON.stringify([
            {
              name: "size_selected",
              type: "combo",
              value: resolution,
              options: {
                values: [
                  "1:1 [1024x1024 square]",
                  "2:3 [800x1200 portrait]",
                  "3:2 [1200x800 landscape]",
                  "9:16 [720x1280 portrait]",
                  "16:9 [1280x720 landscape]"
                ]
              }
            }
          ])
        }
      ]
    }
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(workflowData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed to create job");
  if (!data.job?.id) throw new Error("Missing job ID");
  return data.job.id;
}

// --- Hàm poll trạng thái job ---
async function pollTAMSJobStatus(jobId: string): Promise<string> {
  const apiKey = process.env.TENSOR_ART_API_KEY;
  if (!apiKey) throw new Error("TENSOR_ART_API_KEY is not defined");
  const maxAttempts = 36; // 3 phút
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } });
    const { job } = await response.json();
    if (job?.status === 'SUCCESS') {
      return job.resultUrl;
    }
    if (job?.status === 'FAILURE') {
      throw new Error(job?.message || 'Job failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Timeout waiting for job to complete');
}

// --- API Route POST ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Hỗ trợ cả imageData và imageUrl, ưu tiên imageData
    const { imageData, imageUrl, platform_width, platform_height } = body;
    const img = imageData || imageUrl;
    if (!img || typeof img !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing imageData or imageUrl' }, { status: 400 });
    }
    // 1. Chọn resolution đúng chuẩn nền tảng
    const resolution = pickResolution(Number(platform_width), Number(platform_height));
    // 2. Upload ảnh lấy resourceId
    const resourceId = await uploadImageToTensorArt(img);
    // 3. Tạo job
    const jobId = await createTAMSJob(resourceId, resolution);
    // 4. Poll kết quả
    const resultUrl = await pollTAMSJobStatus(jobId);
    return NextResponse.json({ success: true, resultUrl, jobId });
  } catch (error: any) {
    console.error('TAMS API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xử lý TAMS' }, { status: 500 });
  }
}


// --- API Route OPTIONS cho CORS ---
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}