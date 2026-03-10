import { Client, ConnectConfig, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';
import { SSHProfile } from '../models/types';
import { readFileSync } from 'fs';

interface SSHSession {
  client: Client;
  profile: SSHProfile;
  shell?: ClientChannel;
}

export class SSHManager extends EventEmitter {
  private sessions: Map<string, SSHSession> = new Map();

  async connect(profile: SSHProfile, password?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      const config: ConnectConfig = {
        host: profile.host,
        port: profile.port,
        username: profile.username,
        readyTimeout: 30000,
      };

      if (profile.authType === 'password' && password) {
        config.password = password;
      } else if (profile.authType === 'key' && profile.keyPath) {
        try {
          config.privateKey = readFileSync(profile.keyPath);
        } catch {
          reject(new Error(`Cannot read key file: ${profile.keyPath}`));
          return;
        }
      } else if (profile.authType === 'agent') {
        config.agent = process.env.SSH_AUTH_SOCK;
      }

      client.on('ready', () => {
        this.sessions.set(profile.id, { client, profile });
        resolve();
      });

      client.on('error', (err) => {
        reject(err);
      });

      client.on('close', () => {
        this.sessions.delete(profile.id);
        this.emit('disconnect', profile.id);
      });

      client.connect(config);
    });
  }

  async openShell(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        reject(new Error('No such session'));
        return;
      }

      session.client.shell({ term: 'xterm-256color' }, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        session.shell = stream;

        stream.on('data', (data: Buffer) => {
          this.emit('data', sessionId, data.toString());
        });

        stream.on('close', () => {
          this.emit('shellClose', sessionId);
        });

        resolve();
      });
    });
  }

  writeToShell(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.shell) {
      session.shell.write(data);
    }
  }

  resizeShell(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session?.shell) {
      (session.shell as ClientChannel & { setWindow: (rows: number, cols: number, height: number, width: number) => void }).setWindow(rows, cols, 0, 0);
    }
  }

  async executeCommand(sessionId: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        reject(new Error('No such session'));
        return;
      }

      let output = '';
      session.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });
        stream.stderr.on('data', (data: Buffer) => {
          output += data.toString();
        });
        stream.on('close', () => {
          resolve(output);
        });
      });
    });
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.client.end();
      } catch {
        // ignore
      }
      this.sessions.delete(sessionId);
    }
  }

  listConnections(): string[] {
    return Array.from(this.sessions.keys());
  }
}
