import { WorkflowTypes } from '@/types/workflows';

export const BasicVideoPreview = ({ segment }: { segment: WorkflowTypes.Basic["Segment"] }) => {
  return (
    <div className="basic-preview">
      <img 
        src={segment.imageUrl} 
        alt={`Preview segment ${segment.segmentIdx}`}
        className="rounded-lg border-2 border-blue-200"
      />
      {segment.voiceUrl && (
        <audio controls className="mt-2 w-full">
          <source src={segment.voiceUrl} type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
}; 