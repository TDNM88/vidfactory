import { type } from 'os';
'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

const DEFAULT_WELCOME = `Xin chào! Tôi là trợ lý AI của ứng dụng TDNM. Bạn cần tôi giới thiệu về tính năng, hướng dẫn sử dụng, hay giải đáp thắc mắc nào không?`;

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: DEFAULT_WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: messages.map(({role, content}) => ({role, content})) })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot' as const, content: data?.reply || 'Xin lỗi, tôi chưa trả lời được.' }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'bot' as const, content: 'Xin lỗi, có lỗi xảy ra.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 h-[420px] bg-white shadow-2xl rounded-2xl flex flex-col border border-sky-300">
          <div className="flex items-center justify-between px-4 py-2 bg-sky-500 text-white rounded-t-2xl">
            <span className="font-semibold">Chatbot TDNM</span>
            <button onClick={() => setOpen(false)} className="text-xl font-bold hover:text-sky-200">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-sky-50">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block px-3 py-2 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-sky-200 text-sky-900' : 'bg-white border border-sky-200 text-gray-800'}`}>
                  {msg.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-sky-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 rounded-xl border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Nhập câu hỏi..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
              disabled={loading || !input.trim()}
            >
              Gửi
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-16 h-16 rounded-full shadow-2xl bg-[linear-gradient(135deg,#FFD700,#FFC300)] flex items-center justify-center text-yellow-900 text-4xl font-bold border-4 border-white hover:scale-110 transition-transform ring-4 ring-yellow-300 animate-bounce"
          title="Chatbot TDNM"
        >
          💬
        </button>
      )}
    </div>
  );
}
