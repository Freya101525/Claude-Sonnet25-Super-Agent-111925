export enum ModelProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic'
}

export enum AppStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  provider: ModelProvider;
  promptTemplate: string;
  temperature: number;
  fallbackEnabled: boolean;
}

export interface PdfPage {
  pageNumber: number;
  thumbnailDataUrl: string;
  selected: boolean;
  extractedText?: string; // Simulated/OCR result
}

export interface ExecutionResult {
  agentId: string;
  agentName: string;
  output: string;
  timestamp: number;
  cost: number;
  status: 'success' | 'failed' | 'fallback_triggered';
  providerUsed: ModelProvider;
}

export interface ProjectConfig {
  id: string;
  name: string;
  createdAt: number;
  agents: AgentConfig[];
}

export interface AppState {
  pdfFile: File | null;
  pages: PdfPage[];
  agents: AgentConfig[];
  activeTab: 'upload' | 'agents' | 'run' | 'dashboard';
  executionResults: ExecutionResult[];
  status: AppStatus;
  totalCost: number;
  configHistory: ProjectConfig[];
}

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: '1',
    name: 'Summarizer',
    role: 'Summarizer',
    model: 'gemini-2.5-flash',
    provider: ModelProvider.GEMINI,
    promptTemplate: 'Summarize the following text concisely, highlighting key financial figures.',
    temperature: 0.3,
    fallbackEnabled: true,
  },
  {
    id: '2',
    name: 'Risk Analyst',
    role: 'Analyst',
    model: 'gemini-2.5-flash',
    provider: ModelProvider.GEMINI,
    promptTemplate: 'Identify any potential legal or financial risks in the provided text.',
    temperature: 0.5,
    fallbackEnabled: true,
  }
];