export const BasicProcessingControls = ({ 
  onProcess,
  processing 
}: { 
  onProcess: () => void;
  processing: boolean;
}) => {
  return (
    <div className="processing-controls space-y-4">
      <button
        onClick={onProcess}
        disabled={processing}
        className={`px-4 py-2 rounded-lg ${
          processing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white transition-colors`}
      >
        {processing ? 'Đang xử lý...' : 'Bắt đầu tạo video'}
      </button>
      
      <div className="text-sm text-gray-600">
        <p>Độ phân giải: 720p</p>
        <p>Định dạng: MP4</p>
        <p>Thời lượng tối đa: 5 phút</p>
      </div>
    </div>
  );
}; 