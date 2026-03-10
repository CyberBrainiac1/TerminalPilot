import { contextBridge, ipcRenderer } from 'electron';
import { ShellProfile, SSHProfile, ChatMessage, SessionContext } from '../main/models/types';

contextBridge.exposeInMainWorld('electronAPI', {
  terminal: {
    create: (tabId: string, profile: ShellProfile) =>
      ipcRenderer.invoke('terminal:create', tabId, profile),
    write: (tabId: string, data: string) =>
      ipcRenderer.invoke('terminal:write', tabId, data),
    resize: (tabId: string, cols: number, rows: number) =>
      ipcRenderer.invoke('terminal:resize', tabId, cols, rows),
    close: (tabId: string) =>
      ipcRenderer.invoke('terminal:close', tabId),
    getOutput: (tabId: string, lines?: number) =>
      ipcRenderer.invoke('terminal:getOutput', tabId, lines),
    clear: (tabId: string) =>
      ipcRenderer.invoke('terminal:clear', tabId),
    onData: (tabId: string, callback: (data: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, tid: string, data: string) => {
        if (tid === tabId) callback(data);
      };
      ipcRenderer.on('terminal:data', handler);
      return () => ipcRenderer.removeListener('terminal:data', handler);
    },
    onExit: (callback: (tabId: string, exitCode: number) => void) => {
      ipcRenderer.on('terminal:exit', (_, tabId, exitCode) => callback(tabId, exitCode));
    },
    offData: () => {
      ipcRenderer.removeAllListeners('terminal:data');
    },
  },
  ssh: {
    connect: (profile: SSHProfile, password?: string) =>
      ipcRenderer.invoke('ssh:connect', profile, password),
    write: (sessionId: string, data: string) =>
      ipcRenderer.invoke('ssh:write', sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.invoke('ssh:resize', sessionId, cols, rows),
    disconnect: (sessionId: string) =>
      ipcRenderer.invoke('ssh:disconnect', sessionId),
    execute: (sessionId: string, command: string) =>
      ipcRenderer.invoke('ssh:execute', sessionId, command),
    onData: (callback: (sessionId: string, data: string) => void) => {
      ipcRenderer.on('ssh:data', (_, sessionId, data) => callback(sessionId, data));
    },
    onShellClose: (callback: (sessionId: string) => void) => {
      ipcRenderer.on('ssh:shellClose', (_, sessionId) => callback(sessionId));
    },
  },
  ai: {
    chat: (messages: ChatMessage[], context: SessionContext) =>
      ipcRenderer.invoke('ai:chat', messages, context),
    setApiKey: (key: string) =>
      ipcRenderer.invoke('ai:setApiKey', key),
    clearApiKey: () =>
      ipcRenderer.invoke('ai:clearApiKey'),
    isConfigured: () =>
      ipcRenderer.invoke('ai:isConfigured'),
    setProviderKey: (provider: string, key: string) =>
      ipcRenderer.invoke('ai:setProviderKey', provider, key),
    clearProviderKey: (provider: string) =>
      ipcRenderer.invoke('ai:clearProviderKey', provider),
    isProviderConfigured: (provider: string) =>
      ipcRenderer.invoke('ai:isProviderConfigured', provider),
    approveCommand: (requestId: string, editedCommand?: string) =>
      ipcRenderer.invoke('ai:approveCommand', requestId, editedCommand),
    rejectCommand: (requestId: string) =>
      ipcRenderer.invoke('ai:rejectCommand', requestId),
    onChunk: (callback: (chunk: string) => void) => {
      ipcRenderer.on('ai:chunk', (_, chunk) => callback(chunk));
    },
    offChunk: () => {
      ipcRenderer.removeAllListeners('ai:chunk');
    },
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  shell: {
    getProfiles: () => ipcRenderer.invoke('shell:getProfiles'),
    getDefault: () => ipcRenderer.invoke('shell:getDefault'),
  },
  security: {
    analyzeRisk: (command: string) =>
      ipcRenderer.invoke('security:analyzeRisk', command),
  },
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  },
});
