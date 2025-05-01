import type { NextApiRequest, NextApiResponse } from 'next';

// Sử dụng OpenRouter hoặc Gemini hoặc logic tương tự generate-script để dịch
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function translateWithLLM(text: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set');
  const prompt = `Dịch đoạn văn sau sang tiếng Anh, giữ nguyên nghĩa, không chú thích thêm:
"""
${text}
"""`;
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://your-vercel-app.vercel.app',
      'X-Title': 'TDNM Translate',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout:free',
      messages: [
        { role: 'system', content: 'Bạn là một trợ lý dịch thuật.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 512
    }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `OpenRouter API error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  try {
    const translated = await translateWithLLM(text);
    res.status(200).json({ translated });
  } catch (err: any) {
    res.status(500).json({ error: 'Translate failed', detail: err.message });
  }
}
