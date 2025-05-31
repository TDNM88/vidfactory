import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../utils/auth';
import CreditService from '../../services/CreditService';

// Danh sách phong cách hợp lệ (đồng bộ với DashboardWorkflow.tsx)
const validStyles = ["cinematic", "anime", "flat lay", "realistic"];

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Utility function to call Groq API with retry logic
async function callOpenRouter(prompt: string, apiKey: string, retries = 3) {
  console.log('Sử dụng Groq API với model meta-llama/llama-4-scout-17b-16e-instruct');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Lấy API key của Groq từ biến môi trường hoặc sử dụng giá trị cứng
      const groqApiKey = process.env.GROQ_API_KEY || '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';
      
      if (!groqApiKey) {
        throw new Error('Groq API key không được cung cấp');
      }
      
      console.log('Sử dụng Groq API key:', groqApiKey.substring(0, 10) + '...');
      
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      };
      
      console.log('Headers:', Object.keys(headers).join(', '));
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
    
    // Xác thực người dùng - bỏ qua trong môi trường phát triển
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log('Đang ở môi trường phát triển, bỏ qua xác thực');
      // Tạo user giả cho môi trường phát triển với ID là số
      user = {
        id: 9999,
        username: 'dev-user',
        email: 'dev@example.com',
        credit: 1000
      };
    } else {
      try {
        user = await verifyToken(req, prisma);
        if (!user) {
          console.log('Xác thực thất bại: Không có người dùng');
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        
        // Kiểm tra xem user có tồn tại và có credit field không
        if (!user.hasOwnProperty('credit')) {
          console.error('Lỗi: Người dùng không có thông tin credit');
          return res.status(400).json({ success: false, error: 'Thông tin người dùng không đầy đủ' });
        }
        
        console.log(`Thông tin người dùng: ID=${user.id} (${typeof user.id}), Credit=${user.credit}`);
      } catch (authError) {
        console.error('Lỗi xác thực:', authError);
        return res.status(401).json({ success: false, error: 'Lỗi xác thực người dùng' });
      }
    }
    
    console.log(`Người dùng đã xác thực: ${user.username} (ID: ${user.id})`);

    // Lấy các tham số bắt buộc từ request body
    const { subject, summary, duration, platform, style, workflow } = req.body;
    console.log('Dữ liệu nhận được:', { subject, summary, duration, platform, style, workflow });

    // Validate inputs - kiểm tra đầy đủ các tham số bắt buộc
    if (!subject || !summary) {
      console.log('Thiếu dữ liệu đầu vào');
      return res.status(400).json({ success: false, error: "Chủ đề và tóm tắt nội dung là bắt buộc" });
    }

    if (!duration) {
      console.log('Thiếu thời lượng video');
      return res.status(400).json({ success: false, error: "Thời lượng video là bắt buộc" });
    }

    if (!platform) {
      console.log('Thiếu nền tảng mạng xã hội');
      return res.status(400).json({ success: false, error: "Nền tảng mạng xã hội là bắt buộc" });
    }

    // Kiểm tra và trừ credit
    let creditResult;
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Đang ở môi trường phát triển, bỏ qua kiểm tra credit');
        creditResult = { 
          success: true,
          creditCost: 1,
          remainingCredit: user.credit
        };
      } else {
        // Đảm bảo user.id là số
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        
        // Kiểm tra xem userId có phải là số hợp lệ không
        if (isNaN(userId)) {
          throw new Error(`user.id không hợp lệ: ${user.id}`);
        }
        
        console.log(`Trừ credit cho user ID: ${userId}`);
        
        creditResult = await creditService.deductCredit(
          userId,
          'generate-script', 
          'Tạo kịch bản',
          { username: user.username }
        );
        
        console.log('Kết quả trừ credit:', JSON.stringify(creditResult));
      }
    } catch (creditError) {
      console.error('Lỗi xử lý credit:', creditError);
      return res.status(400).json({ 
        success: false, 
        error: creditError instanceof Error ? creditError.message : 'Lỗi khi kiểm tra và trừ credit' 
      });
    }

    if (!creditResult.success) {
      console.log('Không thể trừ credit:', creditResult.error);
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    console.log(`User ${user.username} deducted ${creditResult.creditCost} credits for script generation`);

    const session_id = crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
    
    // Không cần sử dụng API key ở đây vì đã sử dụng Groq API trong hàm callOpenRouter
    // Với hàm callOpenRouter đã được cập nhật để sử dụng Groq API key trực tiếp
    const dummyApiKey = 'dummy-key'; // Chỉ để gọi hàm, không có tác dụng thực tế
    
    console.log('Sử dụng Groq API với model meta-llama/llama-4-scout-17b-16e-instruct');
    
    // Kiểm tra xem Groq API key có được cấu hình trong môi trường không
    const groqApiKey = process.env.GROQ_API_KEY || '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';
    if (!groqApiKey) {
      console.log('Thiếu Groq API key');
      return res.status(500).json({ success: false, error: "Groq API key không được cấu hình" });
    }

    console.log('Đang xây dựng prompt cho Groq API...');

    // Xác định số phân đoạn tối đa dựa trên workflow
    let maxSegments = 5; // Mặc định cho Basic
    if (workflow === 'basic-plus') {
      maxSegments = 10;
    } else if (workflow === 'premium') {
      maxSegments = 20;
    }

    // Build prompt với thông tin đầy đủ
    const prompt = `
      Bạn là một chuyên gia viết kịch bản video chuyên nghiệp cho mạng xã hội ${platform}. Hãy tạo một kịch bản video hấp dẫn với chủ đề: ${subject}.
      Tóm tắt nội dung: ${summary}
      Độ dài video mong muốn: ${duration} giây. 
      Tổng số phân đoạn tối đa: ${maxSegments} phân đoạn.
      Tổng số phân đoạn, độ dài, và nội dung lời thoại phải phù hợp với thời lượng này (mỗi phân đoạn khoảng 3-5 câu, tổng số phân đoạn và độ dài lời thoại vừa phải để video không quá ngắn hoặc quá dài so với ${duration}).
      ${style ? `Phong cách video: ${style}.` : ''}
      
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

    const data = await callOpenRouter(prompt, dummyApiKey);
    console.log('Đã nhận được phản hồi từ Groq API:', data);

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
      // Tìm kiếm chuỗi JSON trong phản hồi
      const jsonMatch = text.match(/\{[\s\S]*\}/m);
      if (!jsonMatch) {
        throw new Error("Không tìm thấy đoạn JSON hợp lệ trong phản hồi");
      }
      scriptData = JSON.parse(jsonMatch[0]);

      // Kiểm tra cấu trúc JSON
      if (!scriptData.title || !Array.isArray(scriptData.segments)) {
        throw new Error("Cấu trúc JSON không hợp lệ: thiếu title hoặc segments");
      }

      // Chuẩn hóa mô tả ảnh và đảm bảo đủ các trường
      scriptData.segments = scriptData.segments.map((segment: any) => ({
        ...segment,
        script: segment.script || "Không có lời thoại",
        image_description: segment.image_description
          ? segment.image_description.replace(/^(Mô tả ảnh:|Ảnh:|Mô tả:|Image description:)\s*/i, '').trim() 
          : 'Hình ảnh minh họa cho phân đoạn này',
        image_description_en: segment.image_description_en
          ? segment.image_description_en.replace(/^(Image description:|Description:|Mô tả ảnh:|Ảnh:|Mô tả:)\s*/i, '').trim() 
          : 'Illustration for this segment',
      }));

      // Giới hạn số lượng phân đoạn theo workflow
      if (scriptData.segments.length > maxSegments) {
        scriptData.segments = scriptData.segments.slice(0, maxSegments);
      }
    } catch (error) {
      console.error("Error parsing JSON from LLM response:", error, "Raw text:", text);
      return res.status(500).json({ success: false, error: "Lỗi khi phân tích kịch bản từ phản hồi" });
    }

    console.log('Kịch bản đã được phân tích thành công:', scriptData);

    return res.status(200).json({
      success: true,
      script: scriptData,
      session_id,
      workflow, // Trả về thông tin workflow để frontend biết
    });
  } catch (error: any) {
    console.error("Error generating script:", error);
    return res.status(500).json({ success: false, error: error.message || "Lỗi máy chủ nội bộ" });
  }
}