import { NextResponse } from "next/server"

const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1"
const WORKFLOW_TEMPLATE_ID = "809397844309168055"

import crypto from 'crypto';

// Hàm upload image giữ nguyên
async function uploadImageToTensorArt(imageData: string) {
  const url = `${TENSOR_ART_API_URL}/resource/image`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}`
  }
  // 1. Create resource
  const resourceRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expireSec: 7200 }),
  })
  const responseText = await resourceRes.text()
  if (!resourceRes.ok) {
    throw new Error(`POST failed: ${resourceRes.status} - ${responseText}`)
  }
  const resourceResponse = JSON.parse(responseText)
  const putUrl = resourceResponse.putUrl as string

// Hàm tạo job video qua TAMS cho templateId 809397844309168055
const createVideoJob = async (resourceId: string, resolution: string) => {
  const apiKey = process.env.TENSOR_ART_API_KEY;
  const url = `${TENSOR_ART_API_URL}/jobs/workflow/template`;
  const request_id = crypto.createHash('md5').update('' + Date.now()).digest('hex');

  const body = {
    request_id,
    templateId: WORKFLOW_TEMPLATE_ID,
    fields: {
      fieldAttrs: [
        {
          nodeId: "27",
          fieldName: "image",
          fieldValue: resourceId
        },
        {
          nodeId: "28",
          fieldName: "size_selected",
          fieldValue: resolution
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
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed to create job");
  return data.job?.id;
}

export { createVideoJob };

  const resourceId = resourceResponse.resourceId as string
  const putHeaders = (resourceResponse.headers as Record<string, string>) || { 'Content-Type': 'image/png' }
  if (!putUrl || !resourceId) {
    throw new Error(`Invalid response: ${JSON.stringify(resourceResponse)}`)
  }
  // 2. Upload image
  let imageBlob: Blob
  if (imageData.startsWith('http')) {
    imageBlob = await fetch(imageData).then(res => res.blob())
  } else {
    // base64
    const base64 = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    const buffer = Buffer.from(base64, 'base64')
    imageBlob = new Blob([buffer])
  }
  const putResponse = await fetch(putUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: imageBlob,
  })
  if (![200, 203].includes(putResponse.status)) {
    throw new Error(`PUT failed: ${putResponse.status} - ${await putResponse.text()}`)
  }
  // Đợi 8s để đảm bảo ảnh được upload thành công
  await new Promise((resolve) => setTimeout(resolve, 8000))
  return resourceId
}

// Tạo job với resourceId và trả về jobId
async function createTAMSJob(resourceId: string, resolution: string) {
  const url = `${TENSOR_ART_API_URL}/jobs/workflow/template`
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
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.TENSOR_ART_API_KEY}`
    },
    body: JSON.stringify(workflowData)
  })
  const responseData = await response.json()
  if (!responseData.job?.id) {
    throw new Error("Invalid response from TensorArt API: Missing job ID. Full response: " + JSON.stringify(responseData))
  }
  return responseData.job.id
}

// Poll trạng thái job
async function pollTAMSJobStatus(jobId: string) {
  const maxAttempts = 30
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`,
      { headers: { 'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}` } })
    const { job } = await response.json()
    if (job.status === 'SUCCESS') {
      return job.successInfo.images[0].url
    }
    if (job.status === 'FAILED') {
      throw new Error(job.failedInfo?.reason || 'Job failed')
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error('Job processing timed out')
}

// API Route POST
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageData } = body
    // Auto chọn resolution dựa trên platform_width/height nếu có
    let resolution = "1:1 [1024x1024 square]"
    if (body.platform_width && body.platform_height) {
      const w = Number(body.platform_width)
      const h = Number(body.platform_height)
      if (w && h) {
        const ratio = w / h
        if (Math.abs(ratio - 1) < 0.1) resolution = "1:1 [1024x1024 square]"
        else if (Math.abs(ratio - 9/16) < 0.1) resolution = "9:16 [720x1280 portrait]"
        else if (Math.abs(ratio - 16/9) < 0.1) resolution = "16:9 [1280x720 landscape]"
        else if (Math.abs(ratio - 2/3) < 0.1) resolution = "2:3 [800x1200 portrait]"
        else if (Math.abs(ratio - 3/2) < 0.1) resolution = "3:2 [1200x800 landscape]"
      }
    }
    // 1. Upload ảnh lấy resourceId
    const resourceId = await uploadImageToTensorArt(imageData)
    // 2. Tạo job với resourceId
    const jobId = await createTAMSJob(resourceId, resolution)
    // 3. Poll kết quả
    const resultUrl = await pollTAMSJobStatus(jobId)
    return NextResponse.json({ success: true, resultUrl, jobId })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xử lý TAMS' }, { status: 500 })
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}
