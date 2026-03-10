import { ipcMain, BrowserWindow, app, shell } from 'electron';
import { PtyManager } from '../terminal/ptyManager';
import { SSHManager } from '../ssh/sshManager';
import { AIProvider } from '../ai/aiProvider';
import { ApprovalManager } from '../ai/approvalManager';
import { analyzeRisk } from '../security/riskAnalyzer';
import { redactSecrets } from '../security/secretRedactor';
import { loadSettings, saveSettings, resetSettings } from '../storage/settingsStore';
import { getDefaultShellProfiles, getDefaultShell } from '../terminal/shellProfiles';
import { ShellProfile, SSHProfile, ChatMessage, SessionContext } from '../models/types';

export function registerHandlers(mainWindow: BrowserWindow): void {
  const ptyManager = new PtyManager();
  const sshManager = new SSHManager();
  const aiProvider = new AIProvider();
  const approvalManager = new ApprovalManager(ptyManager);

  // Forward PTY data to renderer
  ptyManager.on('data', (tabId: string, data: string) => {
    mainWindow.webContents.send('terminal:data', tabId, data);
  });

  ptyManager.on('exit', (tabId: string, exitCode: number) => {
    mainWindow.webContents.send('terminal:exit', tabId, exitCode);
  });

  // Forward SSH data to renderer
  sshManager.on('data', (sessionId: string, data: string) => {
    mainWindow.webContents.send('ssh:data', sessionId, data);
  });

  sshManager.on('shellClose', (sessionId: string) => {
    mainWindow.webContents.send('ssh:shellClose', sessionId);
  });

  // Terminal IPC
  ipcMain.handle('terminal:create', (_, tabId: string, profile: ShellProfile) => {
    try {
      const pid = ptyManager.createSession(tabId, profile);
      return { success: true, pid };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('terminal:write', (_, tabId: string, data: string) => {
    ptyManager.writeToSession(tabId, data);
  });

  ipcMain.handle('terminal:resize', (_, tabId: string, cols: number, rows: number) => {
    ptyManager.resizeSession(tabId, cols, rows);
  });

  ipcMain.handle('terminal:close', (_, tabId: string) => {
    ptyManager.closeSession(tabId);
  });

  ipcMain.handle('terminal:getOutput', (_, tabId: string, lines: number) => {
    return ptyManager.captureOutput(tabId, lines);
  });

  ipcMain.handle('terminal:clear', (_, tabId: string) => {
    ptyManager.clearCapture(tabId);
  });

  // SSH IPC
  ipcMain.handle('ssh:connect', async (_, profile: SSHProfile, password?: string) => {
    try {
      await sshManager.connect(profile, password);
      await sshManager.openShell(profile.id);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ssh:write', (_, sessionId: string, data: string) => {
    sshManager.writeToShell(sessionId, data);
  });

  ipcMain.handle('ssh:resize', (_, sessionId: string, cols: number, rows: number) => {
    sshManager.resizeShell(sessionId, cols, rows);
  });

  ipcMain.handle('ssh:disconnect', (_, sessionId: string) => {
    sshManager.disconnect(sessionId);
  });

  ipcMain.handle('ssh:execute', async (_, sessionId: string, command: string) => {
    try {
      const output = await sshManager.executeCommand(sessionId, command);
      return { success: true, output };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // AI IPC
  ipcMain.handle('ai:chat', async (_, messages: ChatMessage[], context: SessionContext) => {
    try {
      const settings = loadSettings();
      const fullResponse = await aiProvider.chat(messages, context, settings, (chunk) => {
        mainWindow.webContents.send('ai:chunk', chunk);
      });
      return { success: true, response: fullResponse };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Per-provider key management
  ipcMain.handle('ai:setProviderKey', async (_, provider: string, key: string) => {
    try {
      await aiProvider.setApiKey(provider as import('../models/types').AIProviderType, key);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ai:clearProviderKey', async (_, provider: string) => {
    try {
      await aiProvider.clearApiKey(provider as import('../models/types').AIProviderType);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ai:isProviderConfigured', async (_, provider: string) => {
    return aiProvider.isProviderConfigured(provider as import('../models/types').AIProviderType);
  });

  // Legacy shims — delegate to the active provider from settings
  ipcMain.handle('ai:setApiKey', async (_, key: string) => {
    try {
      const settings = loadSettings();
      await aiProvider.setApiKey(settings.aiProvider, key);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ai:clearApiKey', async () => {
    try {
      const settings = loadSettings();
      await aiProvider.clearApiKey(settings.aiProvider);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ai:isConfigured', async () => {
    const settings = loadSettings();
    return aiProvider.isConfigured(settings.aiProvider);
  });

  ipcMain.handle('ai:approveCommand', async (_, requestId: string, editedCommand?: string) => {
    try {
      await approvalManager.approveAndRun(requestId, editedCommand);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('ai:rejectCommand', (_, requestId: string) => {
    approvalManager.reject(requestId);
    return { success: true };
  });

  // Settings IPC
  ipcMain.handle('settings:get', () => {
    return loadSettings();
  });

  ipcMain.handle('settings:set', (_, settings) => {
    try {
      saveSettings(settings);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('settings:reset', () => {
    return resetSettings();
  });

  // Shell IPC
  ipcMain.handle('shell:getProfiles', () => {
    const settings = loadSettings();
    return settings.shellProfiles.length > 0 ? settings.shellProfiles : getDefaultShellProfiles();
  });

  ipcMain.handle('shell:getDefault', () => {
    const settings = loadSettings();
    const profiles = settings.shellProfiles.length > 0 ? settings.shellProfiles : getDefaultShellProfiles();
    return profiles.find(p => p.id === settings.defaultShellProfileId) ?? profiles[0] ?? getDefaultShell();
  });

  // Security IPC
  ipcMain.handle('security:analyzeRisk', (_, command: string) => {
    return analyzeRisk(command);
  });

  ipcMain.handle('security:redact', (_, text: string) => {
    return redactSecrets(text);
  });

  // App IPC
  ipcMain.handle('app:getInfo', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      arch: process.arch,
    };
  });

  ipcMain.handle('app:openExternal', async (_, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
