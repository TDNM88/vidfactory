import type { NextApiRequest, NextApiResponse } from "next";

// Danh sách phong cách hợp lệ (đồng bộ với DashboardWorkflow.tsx)
const validStyles = ["cinematic", "anime", "flat lay", "realistic"];

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
          model: "meta-llama/llama-4-scout:free",
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
    const { subject, summary, duration, platform, styleSettings } = req.body;

    // Validate inputs
    if (!subject || !summary) {
      return res.status(400).json({ success: false, error: "Chủ đề và tóm tắt nội dung là bắt buộc" });
    }
    if (!styleSettings || !styleSettings.style) {
      return res.status(400).json({ success: false, error: "styleSettings là bắt buộc" });
    }
    if (!validStyles.includes(styleSettings.style)) {
      return res.status(400).json({ success: false, error: `Phong cách không hợp lệ: ${styleSettings.style}` });
    }
    if (styleSettings.character.length > 100 || styleSettings.scene.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Mô tả nhân vật hoặc bối cảnh vượt quá 100 ký tự",
      });
    }

    const session_id = crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ success: false, error: "OpenRouter API key không được cấu hình" });
    }

    // Build prompt with dynamic styleSettings
    const stylePrompt = `
      - **Phong cách**: Tất cả ảnh phải theo phong cách ${styleSettings.style} với màu sắc sống động, ánh sáng mềm mại, và bố cục cân đối.
      - **Nhân vật**: ${styleSettings.character || "Nếu có nhân vật, sử dụng một nhân vật chính nhất quán qua các phân đoạn (mô tả rõ: giới tính, độ tuổi, trang phục, biểu cảm). Nếu không có nhân vật, tập trung vào bối cảnh và đạo cụ."}
      - **Bối cảnh**: ${styleSettings.scene || "Mô tả chi tiết bối cảnh phù hợp với nội dung lời thoại nhưng không lặp lại lời thoại (ví dụ: quán cà phê ấm cúng, công viên xanh mát, văn phòng hiện đại)."}
    `;

    const prompt = `
      Bạn là một chuyên gia viết kịch bản video chuyên nghiệp cho mạng xã hội ${platform}. Hãy tạo một kịch bản video hấp dẫn với chủ đề: ${subject}.
      Tóm tắt nội dung: ${summary}
      Độ dài video mong muốn: ${duration} giây. Tổng số phân đoạn, độ dài, và nội dung lời thoại phải phù hợp với thời lượng này (mỗi phân đoạn khoảng 3-5 câu, tổng số phân đoạn và độ dài lời thoại vừa phải để video không quá ngắn hoặc quá dài so với ${duration}). Nếu cần, tăng số phân đoạn hoặc kéo dài nội dung hợp lý để phù hợp thời lượng.
      
      **Yêu cầu về kịch bản**:
      - Kịch bản cần chia thành các phân đoạn logic, mỗi phân đoạn gồm:
        1. **Lời thoại**: Ngắn gọn, truyền cảm hứng, tự nhiên, phù hợp với người xem trên ${platform}, và khớp với thời lượng tổng thể.
        2. **Mô tả ảnh minh họa**: 
           ${stylePrompt}
           - **Chi tiết**: Mô tả rõ ràng về màu sắc chủ đạo, cảm xúc, ánh sáng, và góc quay (ví dụ: góc cận cảnh, góc rộng). Tránh chung chung, tạo hình ảnh sống động, dễ hình dung.
           - **Không sử dụng tiền tố**: Mô tả ảnh không được bắt đầu bằng các cụm từ như "Mô tả ảnh:", "Ảnh:", "Mô tả:", "Image description:". Chỉ ghi trực tiếp nội dung mô tả.
      - Đảm bảo mô tả ảnh của các phân đoạn có sự liên kết về phong cách và nhân vật (nếu có) để tạo cảm giác đồng bộ cho video.

      **Định dạng kết quả**:
      Trả về JSON với cấu trúc sau:
      {
        "title": "Tiêu đề video",
        "segments": [
          {
            "script": "Lời thoại phân đoạn 1",
            "image_description": "Bối cảnh chi tiết theo phong cách ${styleSettings.style}, nhân vật nhất quán (nếu có)"
          },
          ...
        ]
      }
    `;

    const data = await callOpenRouter(prompt, openRouterApiKey);
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Unexpected response format:", data);
      return res.status(500).json({ success: false, error: "Định dạng phản hồi từ API không hợp lệ" });
    }

    const text = data.choices[0]?.message?.content || "";
    if (!text) {
      console.error("No content in response:", data);
      return res.status(500).json({ success: false, error: "Không có nội dung trong phản hồi từ API" });
    }

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
          .replace(/^(Mô tả ảnh:|Ảnh:|Mô tả:|Image description:)\s*/i, '')
          .trim(),
      }));
    } catch (error) {
      console.error("Error parsing JSON from LLM response:", error, "Raw text:", text);
      return res.status(500).json({ success: false, error: "Lỗi khi phân tích kịch bản từ phản hồi" });
    }

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