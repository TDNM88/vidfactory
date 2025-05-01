import { useViduWorkflow } from './hooks/useVidu';
import { ViduSettingsPanel } from './components/ViduSettingsPanel';
import { AIVideoGenerator } from './components/AIVideoGenerator';

export default function PremiumWorkflow() {
  const { viduState, generateVideo } = useViduWorkflow();
  
  return (
    <div className="premium-workflow space-y-4">
      <ViduSettingsPanel />
      <AIVideoGenerator />
      <button 
        onClick={generateVideo}
        disabled={viduState.processing}
      >
        {viduState.processing ? 'Đang xử lý...' : 'Tạo video Premium'}
      </button>
    </div>
  );
} 