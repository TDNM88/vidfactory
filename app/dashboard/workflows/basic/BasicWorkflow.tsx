import { useBasicWorkflow } from './hooks/useWorkflow';
import { BasicVideoPreview } from './components/BasicVideoPreview';
import { BasicProcessingControls } from './components/BasicProcessingControls';
import { Key } from 'react';

export default function BasicWorkflow() {
  const { state, processSegment } = useBasicWorkflow();

  return (
    <div className="basic-workflow space-y-6">
      {state.segments.map((segment: { imageUrl: string; voiceUrl?: string; segmentIdx: number; platform: string }, idx: Key | null | undefined) => (
        <BasicVideoPreview key={idx} segment={segment} />
      ))}
      
      {/* Chỉ render khi tất cả các phân đoạn đều có video_path */}
      {/* TODO: Đảm bảo Segment có property video_path đúng kiểu. Tạm thời ép kiểu any để tránh lỗi TS. */}
      {state.segments.length > 0 && state.segments.every(seg => !!(seg as any).video_path) && (
        <BasicProcessingControls 
          onProcess={() => processSegment(state.segments[0])} 
          processing={state.processing}
        />
      )}
    </div>
  );
} 