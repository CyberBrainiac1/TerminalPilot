import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { ShellProfile } from '../models/types';
import { OutputCapture } from './outputCapture';

interface PtySession {
  pty: pty.IPty;
  tabId: string;
  profile: ShellProfile;
}

export class PtyManager extends EventEmitter {
  private sessions: Map<string, PtySession> = new Map();
  private capture: OutputCapture = new OutputCapture();

  createSession(tabId: string, profile: ShellProfile): number {
    if (this.sessions.has(tabId)) {
      this.closeSession(tabId);
    }

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      ...profile.env,
    };

    const ptyProcess = pty.spawn(profile.shell, profile.args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: profile.cwd ?? process.env.HOME ?? process.cwd(),
      env,
    });

    const session: PtySession = { pty: ptyProcess, tabId, profile };
    this.sessions.set(tabId, session);

    ptyProcess.onData((data) => {
      this.capture.append(tabId, data);
      this.emit('data', tabId, data);
    });

    ptyProcess.onExit(({ exitCode }) => {
      this.sessions.delete(tabId);
      this.emit('exit', tabId, exitCode);
    });

    return ptyProcess.pid;
  }

  writeToSession(tabId: string, data: string): void {
    const session = this.sessions.get(tabId);
    if (session) {
      session.pty.write(data);
    }
  }

  resizeSession(tabId: string, cols: number, rows: number): void {
    const session = this.sessions.get(tabId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  }

  closeSession(tabId: string): void {
    const session = this.sessions.get(tabId);
    if (session) {
      try {
        session.pty.kill();
      } catch {
        // already dead
      }
      this.sessions.delete(tabId);
      this.capture.clear(tabId);
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  captureOutput(tabId: string, lines = 50): string {
    return this.capture.getRecentOutput(tabId, lines);
  }

  clearCapture(tabId: string): void {
    this.capture.clear(tabId);
  }
}
