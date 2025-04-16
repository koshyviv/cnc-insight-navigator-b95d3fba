
// Type declarations for MediaPipe Genai ML components

interface FilesetResolverStatic {
  forGenAiTasks: (wasmPath: string) => Promise<any>;
}

interface LlmInferenceOptions {
  baseOptions: {
    modelAssetPath: string;
  };
  maxTokens: number;
  topK: number;
  temperature: number;
  randomSeed: number;
}

interface LlmInferenceStatic {
  createFromOptions: (genai: any, options: LlmInferenceOptions) => Promise<any>;
}

// Extend the window interface to include ML objects
interface Window {
  FilesetResolver: FilesetResolverStatic;
  LlmInference: LlmInferenceStatic;
}
