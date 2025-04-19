import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { subject, summary, duration, platform } = await req.json();

    // Validate required fields
    if (!subject || !summary) {
      return NextResponse.json(
        { success: false, error: "Chủ đề và tóm tắt nội dung là bắt buộc" },
        { status: 400 }
      );
    }

    // Create a session ID
    const session_id = crypto.randomUUID();

    // Check for OPENROUTER_API_KEY
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API key không được cấu hình" },
        { status: 500 }
      );
    }

    // Create prompt
    const prompt = `
      Hãy tạo một kịch bản video cho mạng xã hội ${platform} với chủ đề: ${subject}.
      
      Tóm tắt nội dung: ${summary}
      Độ dài video mong muốn: ${duration}
      
      Kịch bản cần được chia thành các phân đoạn rõ ràng, mỗi phân đoạn bao gồm:
      1. Nội dung lời thoại
      2. Mô tả chi tiết về hình ảnh minh họa phù hợp với nội dung
      
      Định dạng kết quả trả về phải là JSON với cấu trúc sau:
      {
          "title": "Tiêu đề video",
          "segments": [
              {
                  "script": "Nội dung lời thoại phân đoạn 1",
                  "image_description": "Mô tả chi tiết về hình ảnh minh họa cho phân đoạn 1"
              },
              ...
          ]
      }
    `;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://your-vercel-app.vercel.app", // Thay bằng domain thực tế
        "X-Title": "Social Video Generator",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout:free", // Giữ nguyên model bạn yêu cầu
        messages: [
          {
            role: "system",
            content: "Bạn là một chuyên gia viết kịch bản video cho mạng xã hội.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    // Check if response is successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorData,
      });
      return NextResponse.json(
        { success: false, error: errorData.error?.message || "Lỗi khi gọi API OpenRouter" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("OpenRouter API response:", data); // Debug phản hồi

    // Check if choices exists
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Unexpected response format:", data);
      return NextResponse.json(
        { success: false, error: "Định dạng phản hồi từ API không hợp lệ" },
        { status: 500 }
      );
    }

    const text = data.choices[0]?.message?.content || "";
    if (!text) {
      console.error("No content in response:", data);
      return NextResponse.json(
        { success: false, error: "Không có nội dung trong phản hồi từ API" },
        { status: 500 }
      );
    }

    // Parse JSON from the response
    let scriptData;
    try {
      let jsonContent = text;

      // Handle markdown code blocks
      if (text.includes("```json") && text.includes("```")) {
        jsonContent = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```") && text.includes("```")) {
        const codeContent = text.split("```")[1].split("```")[0].trim();
        jsonContent = codeContent.startsWith("json") ? codeContent.substring(4).trim() : codeContent;
      } else {
        const startIdx = text.indexOf("{");
        if (startIdx !== -1) {
          let braceCount = 0;
          for (let i = startIdx; i < text.length; i++) {
            if (text[i] === "{") braceCount++;
            else if (text[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                jsonContent = text.substring(startIdx, i + 1);
                break;
              }
            }
          }
        }
      }

      scriptData = JSON.parse(jsonContent);
    } catch (error) {
      console.error("Error parsing JSON from LLM response:", error, "Raw text:", text);
      return NextResponse.json(
        { success: false, error: "Lỗi khi phân tích kịch bản từ phản hồi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      script: scriptData,
      session_id,
    });
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}