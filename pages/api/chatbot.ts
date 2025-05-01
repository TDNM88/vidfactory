import type { NextApiRequest, NextApiResponse } from "next";

// Chatbot API: trả lời tự do về ứng dụng, hướng dẫn, giải đáp, FAQ, ...
async function callOpenRouter(messages: {role: 'user'|'assistant'|'system', content: string}[], apiKey: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://your-vercel-app.vercel.app",
          "X-Title": "TDNM App Chatbot",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout:free",
          messages,
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      if ((error.message.includes("429") || error.message.includes("503")) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { prompt, history } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: "prompt là bắt buộc" });
    }
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ success: false, error: "OpenRouter API key chưa cấu hình" });
    }
    // Tạo system prompt mở rộng, cho phép trả lời mọi câu hỏi về app, hướng dẫn, FAQ, giải đáp, ...
    const systemPrompt =
      `Bạn là trợ lý AI cho ứng dụng TDNM. Ứng dụng TDNM là nền tảng tạo video mạng xã hội chuyên nghiệp bằng AI, hỗ trợ tự động tạo kịch bản, sinh ảnh minh họa, lồng tiếng, dựng video hoàn chỉnh cho các nền tảng như TikTok, YouTube, Instagram. Người dùng chỉ cần nhập chủ đề, tóm tắt nội dung, chọn phong cách, ứng dụng sẽ tự động tạo toàn bộ video từ A-Z (bao gồm kịch bản, ảnh, voice, video). Hãy trả lời chính xác, thân thiện, dễ hiểu mọi câu hỏi về các tính năng (tạo kịch bản, sinh ảnh, upload ảnh, lồng tiếng, xuất video), hướng dẫn sử dụng từng bước, giải đáp các lỗi thường gặp (ví dụ: lỗi upload ảnh, lỗi không hiển thị ảnh, lỗi xuất video), và đưa ra các mẹo sử dụng hiệu quả. Nếu không biết, hãy trả lời "Tôi chưa có thông tin về vấn đề này, bạn vui lòng liên hệ support qua email aigc.tdnm@gmail.com hoặc hotline 0984 519 098."`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: prompt },
    ];
    const data = await callOpenRouter(messages, openRouterApiKey);
    const text = data.choices?.[0]?.message?.content || "Xin lỗi, tôi chưa trả lời được.";
    return res.status(200).json({ success: true, reply: text });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Lỗi máy chủ nội bộ" });
  }
}
