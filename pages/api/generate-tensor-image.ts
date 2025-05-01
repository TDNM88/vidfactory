import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

export default async function handlerTensorImage(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }
  try {
    let body: any = undefined;
    const contentType = req.headers["content-type"] || "";
    let prompt: string | undefined;
    let model_id: string | undefined;
    let lora_items: any;
    let width: number | undefined;
    let height: number | undefined;
    const tensorApiUrl = process.env.TENSOR_API_URL;
    const tensorApiKey = process.env.TENSOR_API_KEY;
    const prisma = new PrismaClient();
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (contentType.includes("application/json")) {
      body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Invalid JSON format"));
          }
        });
        req.on("error", (err) => reject(err));
      });
      prompt = body.prompt;
      model_id = body.model_id;
      lora_items = body.lora_items;
      width = body.width;
      height = body.height;
    } else {
      return res.status(400).json({ success: false, error: "Unsupported content type" });
    }
    if (!tensorApiUrl || !tensorApiKey) {
      return res.status(500).json({ success: false, error: "Missing TENSOR_API_URL or TENSOR_API_KEY" });
    }
    if (!prompt || !model_id) {
      return res.status(400).json({ success: false, error: "Missing prompt or model_id" });
    }
    // Build object txt2imgData cho Tensor API
    const diffusion: any = {
      width: width || 512,
      height: height || 512,
      prompts: [{ text: prompt }],
      sampler: body?.sampler || "DPM++ 2M Karras",
      sdVae: body?.sdVae || "Automatic",
      steps: body?.steps || 15,
      sd_model: model_id,
      clip_skip: body?.clip_skip || 2,
      cfg_scale: body?.cfg_scale || 7
    };
    if (lora_items && Array.isArray(lora_items) && lora_items.length > 0) {
      diffusion.lora = { items: lora_items };
    }
    const txt2imgData = {
      request_id: Math.random().toString(36).substring(2, 15),
      stages: [
        {
          type: "INPUT_INITIALIZE",
          inputInitialize: {
            seed: -1,
            count: 1
          }
        },
        {
          type: "DIFFUSION",
          diffusion
        }
      ]
    };
    // Gọi Tensor API
    const tensorResp = await fetch(tensorApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tensorApiKey}`
      },
      body: JSON.stringify(txt2imgData)
    });
    if (!tensorResp.ok) {
      const err = await tensorResp.text();
      return res.status(500).json({ success: false, error: `Tensor API error: ${err}` });
    }
    const tensorData = await tensorResp.json();
    const jobId = tensorData.job?.id;
    if (!jobId) return res.status(500).json({ success: false, error: "No job id from tensor API" });
    // Poll kết quả job (timeout 5 phút, mỗi 10s)
    const jobStatusUrl = `${tensorApiUrl}/${jobId}`;
    let imageUrl = null;
    const pollIntervalMs = 10000; // 10s
    const timeoutMs = 300000; // 5 phút
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise(r => setTimeout(r, pollIntervalMs));
      const pollResp = await fetch(jobStatusUrl, {
        headers: { "Authorization": `Bearer ${tensorApiKey}` }
      });
      const pollData = await pollResp.json();
      if (pollData.job?.status === 'SUCCESS') {
        imageUrl = pollData.job?.successInfo?.images?.[0]?.url;
        break;
      }
      if (pollData.job?.status === 'FAILED') {
        return res.status(500).json({ success: false, error: "Tensor job failed" });
      }
    }
    if (!imageUrl) {
      return res.status(500).json({ success: false, error: "Timeout waiting for image generation" });
    }
    return res.status(200).json({
      success: true,
      direct_image_url: imageUrl
    });
  } catch (error: any) {
    console.error("Tensor image API error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to process Tensor image" });
  }
} 