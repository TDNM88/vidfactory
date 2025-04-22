import type { SessionData } from "../video-generator";

type ImageGeneratorProps = {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export default function ImageGenerator(props: ImageGeneratorProps) {
  return null;
}
