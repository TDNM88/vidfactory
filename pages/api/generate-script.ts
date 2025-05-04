import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../utils/auth';
import CreditService from '../../services/CreditService';

// Danh sách phong cách hợp lệ (đồng bộ với DashboardWorkflow.tsx)
const validStyles = ["cinematic", "anime", "flat lay", "realistic"];

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Utility function to call OpenRouter with retry logic
async function callOpenRouter(prompt: string, apiKey: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://your-vercel-app.vercel.app",
          "X-Title": "Social Video Generator",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-maverick:free",
          messages: [
            { role: "system", content: "Bạn là một chuyên gia viết kịch bản video cho mạng xã hội." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      if ((error.message.includes("429") || error.message.includes("503")) && attempt < retries) {
        console.warn(`Attempt ${attempt} failed with transient error, retrying...`);
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
    console.log('API /api/generate-script được gọi');
    
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      console.log('Xác thực thất bại: Không có người dùng');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    console.log(`Người dùng đã xác thực: ${user.username} (ID: ${user.id})`);

    const { subject, summary, duration, platform } = req.body;
    console.log('Dữ liệu nhận được:', { subject, summary, duration, platform });

    // Validate inputs
    if (!subject || !summary) {
      console.log('Thiếu dữ liệu đầu vào');
      return res.status(400).json({ success: false, error: "Chủ đề và tóm tắt nội dung là bắt buộc" });
    }

    // Kiểm tra và trừ credit
    const creditResult = await creditService.deductCredit(
      user.id, 
      'generate-script', 
      'Tạo kịch bản',
      { username: user.username }
    );

    if (!creditResult.success) {
      console.log('Không thể trừ credit:', creditResult.error);
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    console.log(`User ${user.username} deducted ${creditResult.creditCost} credits for script generation`);

    const session_id = crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.log('Thiếu OpenRouter API key');
      return res.status(500).json({ success: false, error: "OpenRouter API key không được cấu hình" });
    }

    console.log('Đang xây dựng prompt cho OpenRouter API...');

    // Build prompt without style, character, or scene
    const prompt = `
      Bạn là một chuyên gia viết kịch bản video chuyên nghiệp cho mạng xã hội ${platform}. Hãy tạo một kịch bản video hấp dẫn với chủ đề: ${subject}.
      Tóm tắt nội dung: ${summary}
      Độ dài video mong muốn: ${duration} giây. Tổng số phân đoạn, độ dài, và nội dung lời thoại phải phù hợp với thời lượng này (mỗi phân đoạn khoảng 3-5 câu, tổng số phân đoạn và độ dài lời thoại vừa phải để video không quá ngắn hoặc quá dài so với ${duration}). Nếu cần, tăng số phân đoạn hoặc kéo dài nội dung hợp lý để phù hợp thời lượng.
      
      **Yêu cầu về kịch bản**:
      - Kịch bản cần chia thành các phân đoạn logic, mỗi phân đoạn gồm:
        1. **Lời thoại**: Ngắn gọn, truyền cảm hứng, tự nhiên, phù hợp với người xem trên ${platform}, và khớp với thời lượng tổng thể.
        2. **Mô tả ảnh minh họa**: 
           - **Chi tiết**: Mô tả rõ ràng về màu sắc chủ đạo, cảm xúc, ánh sáng, và góc quay (ví dụ: góc cận cảnh, góc rộng). Tránh chung chung, tạo hình ảnh sống động, dễ hình dung.
           - **Không sử dụng tiền tố**: Mô tả ảnh không được bắt đầu bằng các cụm từ như "Mô tả ảnh:", "Ảnh:", "Mô tả:", "Image description:". Chỉ ghi trực tiếp nội dung mô tả.
           - **Bổ sung bản dịch tiếng Anh**: Trả về thêm trường image_description_en là bản dịch tiếng Anh tự nhiên, không chú thích, không tiền tố, chỉ nội dung mô tả ảnh.
      - Đảm bảo mô tả ảnh của các phân đoạn có sự liên kết để tạo cảm giác đồng bộ cho video.

      **Định dạng kết quả**:
      Trả về JSON với cấu trúc sau:
      {
        "title": "Tiêu đề video",
        "segments": [
          {
            "script": "Lời thoại phân đoạn 1",
            "image_description": "Bối cảnh chi tiết cho phân đoạn (tiếng Việt)",
            "image_description_en": "Mô tả ảnh tiếng Anh cho phân đoạn"
          },
          ...
        ]
      }
    `;

    console.log('Prompt đã được xây dựng:', prompt);

    const data = await callOpenRouter(prompt, openRouterApiKey);
    console.log('Đã nhận được phản hồi từ OpenRouter API:', data);

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Unexpected response format:", data);
      return res.status(500).json({ success: false, error: "Định dạng phản hồi từ API không hợp lệ" });
    }

    const text = data.choices[0]?.message?.content || "";
    if (!text) {
      console.error("No content in response:", data);
      return res.status(500).json({ success: false, error: "Không có nội dung trong phản hồi từ API" });
    }

    console.log('Đang phân tích kịch bản từ phản hồi...');

    // Parse JSON from the response
    let scriptData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/m);
      if (!jsonMatch) {
        throw new Error("Không tìm thấy đoạn JSON hợp lệ trong phản hồi");
      }
      scriptData = JSON.parse(jsonMatch[0]);

      // Chuẩn hóa mô tả ảnh
      scriptData.segments = scriptData.segments.map((segment: any) => ({
        ...segment,
        image_description: segment.image_description
          ? segment.image_description.replace(/^(Mô tả ảnh:|Ảnh:|Mô tả:|Image description:)\s*/i, '').trim() : '',
        image_description_en: segment.image_description_en
          ? segment.image_description_en.replace(/^(Image description:|Description:|Mô tả ảnh:|Ảnh:|Mô tả:)\s*/i, '').trim() : '',
      }));
    } catch (error) {
      console.error("Error parsing JSON from LLM response:", error, "Raw text:", text);
      return res.status(500).json({ success: false, error: "Lỗi khi phân tích kịch bản từ phản hồi" });
    }

    console.log('Kịch bản đã được phân tích thành công:', scriptData);

    return res.status(200).json({
      success: true,
      script: scriptData,
      session_id,
    });
  } catch (error: any) {
    console.error("Error generating script:", error);
    return res.status(500).json({ success: false, error: error.message || "Lỗi máy chủ nội bộ" });
  }
}