export interface ShellProfile {
  id: string;
  name: string;
  shell: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  icon?: string;
}

export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key' | 'agent';
  keyPath?: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  type: 'local' | 'ssh';
  shellProfile?: ShellProfile;
  sshProfile?: SSHProfile;
  cwd?: string;
  isActive: boolean;
  pid?: number;
}

export interface SplitPane {
  id: string;
  tabs: TerminalTab[];
  orientation?: 'horizontal' | 'vertical';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  commandProposals?: CommandProposal[];
  outputSummary?: string;
}

export interface CommandProposal {
  id: string;
  command: string;
  explanation: string;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  riskReason?: string;
  targetSession?: string;
  status: 'pending' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
  output?: string;
  editedCommand?: string;
}

export interface ApprovalRequest {
  id: string;
  proposal: CommandProposal;
  sessionContext: SessionContext;
  createdAt: number;
}

export interface SessionContext {
  tabId: string;
  type: 'local' | 'ssh';
  shell?: string;
  cwd?: string;
  hostname?: string;
  recentOutput?: string;
}

export interface RiskAssessment {
  level: 'safe' | 'moderate' | 'high' | 'critical';
  reasons: string[];
  matchedPatterns: string[];
}

export type AIProviderType = 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'ollama';

export interface AppSettings {
  aiProvider: AIProviderType;
  aiModel: string;
  ollamaBaseUrl: string;
  openrouterBaseUrl: string;
  defaultShellProfileId: string;
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  terminalOpacity: number;
  scrollback: number;
  captureOutput: boolean;
  includeEnvInContext: boolean;
  includeCwdInContext: boolean;
  autoRedactSecrets: boolean;
  requireApproval: boolean;
  showWelcomeOnStart: boolean;
  sshProfiles: SSHProfile[];
  shellProfiles: ShellProfile[];
}
