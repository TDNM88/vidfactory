import type { SessionData } from "../video-generator";

type VoiceGeneratorProps = {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export default function VoiceGenerator(props: VoiceGeneratorProps) {
  return null;
}
