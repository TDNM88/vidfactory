import type { SessionData } from "../video-generator";

type VideoAssemblerProps = {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export default function VideoAssembler(props: VideoAssemblerProps) {
  return null;
}
