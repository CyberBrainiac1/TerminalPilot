import { platform } from 'os';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { ShellProfile } from '../models/types';

const os = platform();

function generateId(): string {
  return randomUUID();
}

export function getDefaultShellProfiles(): ShellProfile[] {
  if (os === 'win32') {
    const profiles: ShellProfile[] = [];
    
    const ps = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    const ps7 = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
    const cmd = 'C:\\Windows\\System32\\cmd.exe';
    const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';

    if (existsSync(ps)) {
      profiles.push({ id: generateId(), name: 'PowerShell', shell: ps, args: ['-NoLogo'] });
    }
    if (existsSync(ps7)) {
      profiles.push({ id: generateId(), name: 'PowerShell 7', shell: ps7, args: ['-NoLogo'] });
    }
    if (existsSync(cmd)) {
      profiles.push({ id: generateId(), name: 'Command Prompt', shell: cmd, args: [] });
    }
    if (existsSync(gitBash)) {
      profiles.push({ id: generateId(), name: 'Git Bash', shell: gitBash, args: ['--login', '-i'] });
    }
    return profiles;
  } else if (os === 'darwin') {
    const profiles: ShellProfile[] = [];
    const shells = [
      { path: '/bin/zsh', name: 'zsh' },
      { path: '/bin/bash', name: 'bash' },
      { path: '/usr/local/bin/fish', name: 'fish' },
    ];
    for (const s of shells) {
      if (existsSync(s.path)) {
        profiles.push({ id: generateId(), name: s.name, shell: s.path, args: ['--login'] });
      }
    }
    return profiles;
  } else {
    // Linux
    const profiles: ShellProfile[] = [];
    const shells = [
      { path: '/bin/bash', name: 'bash' },
      { path: '/bin/zsh', name: 'zsh' },
      { path: '/bin/sh', name: 'sh' },
      { path: '/usr/bin/fish', name: 'fish' },
      { path: '/usr/bin/zsh', name: 'zsh' },
    ];
    const seen = new Set<string>();
    for (const s of shells) {
      if (existsSync(s.path) && !seen.has(s.name)) {
        seen.add(s.name);
        profiles.push({ id: generateId(), name: s.name, shell: s.path, args: ['--login'] });
      }
    }
    return profiles;
  }
}

export function getDefaultShell(): ShellProfile {
  const profiles = getDefaultShellProfiles();
  return profiles[0] ?? {
    id: 'default',
    name: 'sh',
    shell: '/bin/sh',
    args: [],
  };
}
