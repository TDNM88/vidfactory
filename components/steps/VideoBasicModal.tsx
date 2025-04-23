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

export default function VideoBasicModal({ segment, idx, onClose, onConfirm }: VideoBasicModalProps) {
  const [url, setUrl] = useState("");

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Tạo video BASIC cho phân đoạn {idx + 1}
        </h3>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 mb-4 text-sm"
          placeholder="Nhập URL video (ví dụ: https://example.com/video.mp4)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <OutlineButton className="px-3 py-1.5 text-sm" onClick={onClose}>
            Hủy
          </OutlineButton>
          <GradientButton
            className="px-3 py-1.5 text-sm"
            onClick={() => {
              if (url) {
                onConfirm(url);
              } else {
                toast.error("Vui lòng nhập URL video!");
              }
            }}
          >
            Xác nhận
          </GradientButton>
        </div>
      </div>
    </Modal>
  );
}