import React from "react";

export default function FinalVideoResult({ videoUrl, onBack }: { videoUrl: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Video kết quả cuối cùng</h1>
      <video controls className="max-w-full rounded-lg shadow-lg mb-4" src={videoUrl} />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        onClick={onBack}
      >
        Quay lại bảng điều khiển
      </button>
    </div>
  );
}
