import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../utils/auth';
import CreditService from '../../services/CreditService';
import axios from 'axios';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Kiểm tra và trừ credit
    const creditResult = await creditService.deductCredit(
      user.id, 
      'analyze_content', 
      'Phân tích nội dung văn bản',
      { username: user.username }
    );

    if (!creditResult.success) {
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    console.log(`User ${user.username} deducted ${creditResult.creditCost} credits for content analysis`);

    let keywords: string[] = [];
    
    // Thử phân tích với OpenRouter API
    try {
      if (OPENROUTER_API_KEY) {
        const response = await axios.post(
          OPENROUTER_URL,
          {
            model: "anthropic/claude-3-haiku",
            messages: [
              {
                role: "user",
                content: `Phân tích nội dung sau và cung cấp 5-10 từ khóa quan trọng nhất liên quan đến nội dung này. Chỉ trả về danh sách từ khóa, không có giải thích thêm:\n\n${content}`
              }
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Thêm kiểu dữ liệu cho response.data
        interface OpenRouterResponse {
          choices?: Array<{
            message: {
              content: string;
            };
          }>;
        }

        const responseData = response.data as OpenRouterResponse;
        if (responseData && responseData.choices && responseData.choices[0]) {
          const generatedText = responseData.choices[0].message.content;
          // Phân tích văn bản để trích xuất các từ khóa
          keywords = extractKeywords(generatedText);
        }
      }
    } catch (error) {
      console.error('Error using OpenRouter API:', error);
      // Sử dụng phân tích từ khóa cục bộ nếu API gọi thất bại
      keywords = localKeywordAnalysis(content);
    }

    // Nếu không có từ khóa từ API, sử dụng phương thức cục bộ
    if (keywords.length === 0) {
      keywords = localKeywordAnalysis(content);
    }

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      keywords,
      credits: {
        cost: creditResult.creditCost,
        remaining: creditResult.remainingCredit
      }
    });
  } catch (error) {
    console.error('Error in analyze-content API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Hàm phân tích từ khóa cục bộ
function localKeywordAnalysis(content: string): string[] {
  // Từ điển từ khóa quan trọng theo chủ đề
  const keywordDictionary = {
    technology: ['công nghệ', 'AI', 'trí tuệ nhân tạo', 'số hóa', 'phần mềm', 'internet', 'thiết bị', 'điện thoại', 'máy tính', 'robot', 'tự động hóa', 'IoT', 'dữ liệu', 'cloud', 'bảo mật', 'mạng'],
    business: ['kinh doanh', 'doanh nghiệp', 'tiếp thị', 'marketing', 'thương mại', 'lợi nhuận', 'đầu tư', 'thị trường', 'chiến lược', 'khách hàng', 'sản phẩm', 'dịch vụ', 'bán hàng', 'thành công', 'đối tác'],
    health: ['sức khỏe', 'y tế', 'bệnh viện', 'bác sĩ', 'dinh dưỡng', 'tập luyện', 'thể dục', 'thể thao', 'vitamin', 'thuốc', 'chăm sóc', 'phòng bệnh', 'điều trị', 'khám bệnh', 'chế độ ăn'],
    education: ['giáo dục', 'học tập', 'trường học', 'sinh viên', 'học sinh', 'kiến thức', 'kỹ năng', 'đào tạo', 'giảng dạy', 'phát triển', 'tài liệu', 'sách', 'thư viện', 'nghiên cứu', 'thông tin'],
    entertainment: ['giải trí', 'âm nhạc', 'phim ảnh', 'nghệ thuật', 'ca sĩ', 'diễn viên', 'sân khấu', 'biểu diễn', 'vui chơi', 'sáng tạo', 'thư giãn', 'hài hước', 'truyền hình', 'game', 'thể thao'],
    travel: ['du lịch', 'khách sạn', 'địa điểm', 'văn hóa', 'ẩm thực', 'lịch sử', 'tham quan', 'khám phá', 'trải nghiệm', 'phương tiện', 'danh lam', 'thắng cảnh', 'đặt phòng', 'hành trình', 'lịch trình'],
    food: ['ẩm thực', 'món ăn', 'nấu nướng', 'nhà hàng', 'đồ uống', 'thực phẩm', 'công thức', 'hương vị', 'nguyên liệu', 'bữa ăn', 'chế biến', 'dinh dưỡng', 'đầu bếp', 'quán ăn', 'khẩu vị'],
    fashion: ['thời trang', 'quần áo', 'phụ kiện', 'phong cách', 'xu hướng', 'thiết kế', 'thương hiệu', 'mẫu mã', 'màu sắc', 'chất liệu', 'mùa', 'bộ sưu tập', 'mẫu', 'cá tính', 'đẹp'],
  };

  // Chuyển đổi nội dung thành chữ thường
  const lowerContent = content.toLowerCase();
  
  // Mảng lưu trữ từ khóa được tìm thấy và số lượng xuất hiện
  const foundKeywords: { [key: string]: number } = {};
  
  // Kiểm tra từng từ khóa trong từ điển
  for (const category in keywordDictionary) {
    for (const keyword of keywordDictionary[category as keyof typeof keywordDictionary]) {
      // Đếm số lần xuất hiện của từ khóa
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      const matches = lowerContent.match(regex);
      
      if (matches) {
        foundKeywords[keyword] = matches.length;
      }
    }
  }
  
  // Sắp xếp các từ khóa theo số lần xuất hiện (giảm dần)
  const sortedKeywords = Object.entries(foundKeywords)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Trả về tối đa 10 từ khóa
  return sortedKeywords.slice(0, 10);
}

// Hàm trích xuất từ khóa từ phản hồi của API
function extractKeywords(text: string): string[] {
  // Loại bỏ các ký tự đặc biệt và định dạng
  const cleanText = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  
  // Tách các từ khóa bằng dấu xuống dòng, dấu phẩy, hoặc dấu chấm
  const keywordCandidates = cleanText.split(/[\n,.-]+/).map(k => k.trim()).filter(k => k.length > 0);
  
  // Loại bỏ các số thứ tự và ký tự đặc biệt
  const keywords = keywordCandidates.map(k => k.replace(/^\d+[\.\)\-]?\s*/, '').trim());
  
  // Loại bỏ các từ khóa quá ngắn hoặc quá dài
  return keywords.filter(k => k.length >= 2 && k.length <= 50).slice(0, 10);
}
