// Electron API type declarations for renderer process
import type { ShellProfile, SSHProfile, AppSettings, SessionContext } from './types';

interface ChatMessageAPI {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ElectronAPI {
  terminal: {
    create: (tabId: string, profile: ShellProfile | undefined, size: { cols: number; rows: number }) => Promise<number>;
    write: (tabId: string, data: string) => Promise<void>;
    resize: (tabId: string, cols: number, rows: number) => Promise<void>;
    close: (tabId: string) => Promise<void>;
    getOutput: (tabId: string, lines?: number) => Promise<string>;
    clear: (tabId: string) => Promise<void>;
    onData: (tabId: string, cb: (data: string) => void) => () => void;
    onExit: (cb: (tabId: string, exitCode: number) => void) => void;
    offData: () => void;
  };
  ssh: {
    connect: (profile: SSHProfile, password?: string) => Promise<void>;
    write: (sessionId: string, data: string) => Promise<void>;
    resize: (sessionId: string, cols: number, rows: number) => Promise<void>;
    disconnect: (sessionId: string) => Promise<void>;
    execute: (sessionId: string, command: string) => Promise<string>;
    onData: (cb: (sessionId: string, data: string) => void) => void;
    onShellClose: (cb: (sessionId: string) => void) => void;
  };
  ai: {
    chat: (messages: ChatMessageAPI[], context?: SessionContext) => Promise<string>;
    setApiKey: (key: string) => Promise<void>;
    clearApiKey: () => Promise<void>;
    isConfigured: () => Promise<boolean>;
    approveCommand: (requestId: string, editedCommand?: string) => Promise<void>;
    rejectCommand: (requestId: string) => Promise<void>;
    onChunk: (cb: (chunk: string) => void) => void;
    offChunk: () => void;
  };
  settings: {
    get: () => Promise<AppSettings>;
    set: (settings: AppSettings) => Promise<void>;
    reset: () => Promise<void>;
  };
  shell: {
    getProfiles: () => Promise<ShellProfile[]>;
    getDefault: () => Promise<ShellProfile>;
  };
  security: {
    analyzeRisk: (command: string) => Promise<{ level: string; reasons: string[]; matchedPatterns: string[] }>;
  };
  app: {
    getInfo: () => Promise<{ name: string; version: string; platform: string }>;
    openExternal: (url: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
