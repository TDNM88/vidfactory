"use client";

import { useState, useEffect } from "react";
import { DashboardWorkflow } from "./steps/dashboard-workflow";
import { GlassCard } from "./ui-custom/glass-card";
import { AnimatePresence, motion } from "framer-motion";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

import type { Segment } from "./steps/image-generator";

export type Script = {
  title: string;
  segments: Segment[];
  video_path?: string;
  thumbnail_path?: string;
};

export type SessionData = {
  session_id: string;
  script: Script;
  platform?: string;
  duration?: number;
};

export function VideoGenerator() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ topic: "", summary: "", platform: "TikTok", duration: 60 });
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!sessionData) {
    return (
      <div className="max-w-md mx-auto py-10">
        <h2 className="text-xl font-bold mb-4 text-center">Bắt đầu quy trình tạo video</h2>
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            setIsFormLoading(true);
            setFormError(null);
            try {
              const res = await fetch("/api/generate-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subject: form.topic,
                  summary: form.summary,
                  platform: form.platform,
                  duration: form.duration,
                })
              });
              if (!res.ok) throw new Error("Lỗi server hoặc kết nối.");
              const data = await res.json();
              if (!data.success || !data.script) throw new Error(data.error || "Không tạo được kịch bản.");
              setSessionData({
                session_id: Date.now().toString(),
                script: {
                  ...data.script,
                  platform: form.platform,
                  duration: form.duration,
                }
              });
            } catch (err: any) {
              setFormError(err.message || "Đã xảy ra lỗi không xác định.");
            } finally {
              setIsFormLoading(false);
            }
          }}
        >
          <div>
            <label className="block mb-1 font-medium">Chủ đề video</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              required
              placeholder="Ví dụ: Cách học tiếng Anh hiệu quả"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Tóm tắt nội dung</label>
            <textarea
              className="w-full border rounded px-3 py-2 h-20"
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              required
              placeholder="Ví dụ: Video hướng dẫn các mẹo học tiếng Anh nhanh, dễ nhớ dành cho người mới bắt đầu."
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Nền tảng</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            >
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Độ dài video (giây)</label>
            <input
              type="number"
              min={10}
              max={600}
              className="w-full border rounded px-3 py-2"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              required
            />
          </div>
          {formError && <div className="text-red-600 text-sm">{formError}</div>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition flex items-center justify-center"
            disabled={isFormLoading}
          >
            {isFormLoading ? <span className="animate-spin mr-2">⏳</span> : null}
            Tạo kịch bản
          </button>
        </form>
      </div>
    );
  }

  return (
    <DashboardWorkflow
      sessionData={sessionData}
      setSessionData={setSessionData}
      setIsLoading={setIsLoading}
      isLoading={isLoading}
    />
  );
}