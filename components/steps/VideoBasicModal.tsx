import { Modal } from "../ui-custom/modal";
import { GradientButton } from "../ui-custom/gradient-button";
import { OutlineButton } from "../ui-custom/outline-button";
import { toast } from "react-toastify";
import { useState } from "react";

interface Segment {
  script: string;
  image_description: string;
  image_path?: string;
  audio_path?: string;
  direct_image_url?: string;
  direct_voice_url?: string;
  voice_sample_path?: string;
}

interface VideoBasicModalProps {
  segment: Segment;
  idx: number;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

const VOICE_OPTIONS = [
  { label: "Mai An", value: "/voices/Mai An.wav" },
  { label: "Phan Linh", value: "/voices/Phan Linh.wav" },
  { label: "Trường Giang", value: "/voices/Trường Giang.wav" },
];

export default function VideoBasicModal({ segment, idx, onClose, onConfirm }: VideoBasicModalProps) {
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tạo video basic: 1. tạo voice, 2. ghép video, 3. trả về url
  const handleCreateBasicVideo = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Gọi API tạo voice
      const voiceRes = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: segment.script,
          voiceSamplePath: selectedVoice,
        }),
      });
      if (!voiceRes.ok) throw new Error("Tạo giọng đọc thất bại!");
      const voiceData = await voiceRes.json();
      if (!voiceData.success || !voiceData.audioUrl) throw new Error(voiceData.error || "Không tạo được audio!");
      // 2. Gọi API ghép video từ ảnh và audio
      const imageUrl = segment.direct_image_url || segment.image_path;
      if (!imageUrl) throw new Error("Không có ảnh minh họa để ghép video!");
      const videoRes = await fetch("/api/create-video-from-image-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          audioUrl: voiceData.audioUrl,
        }),
      });
      if (!videoRes.ok) throw new Error("Tạo video từ ảnh và audio thất bại!");
      const videoData = await videoRes.json();
      if (!videoData.success || !videoData.videoUrl) throw new Error(videoData.error || "Không tạo được video!");
      // 3. Trả url video về
      onConfirm(videoData.videoUrl);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định!");
      toast.error(err.message || "Đã xảy ra lỗi không xác định!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Tạo video BASIC cho phân đoạn {idx + 1}
        </h3>
        <div className="mb-4">
          <div className="font-medium mb-2">Chọn giọng đọc:</div>
          <div className="flex flex-col gap-2">
            {VOICE_OPTIONS.map((voice) => (
              <label key={voice.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="voice"
                  value={voice.value}
                  checked={selectedVoice === voice.value}
                  onChange={() => setSelectedVoice(voice.value)}
                  disabled={loading}
                />
                <span>{voice.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <OutlineButton className="px-3 py-1.5 text-sm" onClick={onClose} disabled={loading}>
            Hủy
          </OutlineButton>
          <GradientButton
            className="px-3 py-1.5 text-sm"
            onClick={handleCreateBasicVideo}
            disabled={loading}
            isLoading={loading}
            loadingText="Đang tạo video..."
          >
            Tạo video BASIC
          </GradientButton>
        </div>
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>
    </Modal>
  );
}