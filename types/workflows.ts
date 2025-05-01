export namespace WorkflowTypes {
  // Basic types
  export interface Basic {
    VideoRequest: {
      imageUrl: string;
      voiceUrl?: string;
      segmentIdx: number;
      platform: 'TikTok' | 'YouTube' | 'Instagram';
    };
    State: {
      segments: WorkflowTypes.Basic["Segment"][];
      processing: boolean;
    };
    Segment: {
      imageUrl: string;
      voiceUrl?: string;
      segmentIdx: number;
      platform: string;
    };
    // ... other Basic types
  }

  // Premium types
  export interface Premium {
    ViduParams: {
      model: string;
      images: string[];
      prompt: string;
      duration: number;
      resolution: string;
      movement_amplitude: string;
    };
    // ... other Premium types
  }
} 