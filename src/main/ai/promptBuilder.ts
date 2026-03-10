import { SessionContext, AppSettings } from '../models/types';
import { redactSecrets } from '../security/secretRedactor';

export function buildSystemPrompt(context: SessionContext, settings: AppSettings): string {
  const lines: string[] = [
    'You are TerminalPilot AI, an intelligent assistant integrated into a terminal application.',
    '',
    '## Your Role',
    '- Help users with terminal commands, debugging, and system administration',
    '- Propose commands for the user to review before execution',
    '- Explain what commands do before suggesting them',
    '- Identify potential risks in commands',
    '',
    '## Rules',
    '1. NEVER execute commands directly. Always propose them for user approval.',
    '2. When proposing a command, format it as: ```bash\\n<command>\\n```',
    '3. Explain what the command does and any risks involved.',
    '4. For destructive operations, add explicit warnings.',
    '5. Keep responses concise and terminal-focused.',
    '',
    '## Current Session Context',
  ];

  lines.push(`- Session type: ${context.type}`);
  
  if (context.hostname) {
    lines.push(`- Host: ${context.hostname}`);
  }
  
  if (context.shell) {
    lines.push(`- Shell: ${context.shell}`);
  }
  
  if (settings.includeCwdInContext && context.cwd) {
    lines.push(`- Working directory: ${context.cwd}`);
  }

  if (settings.captureOutput && context.recentOutput) {
    const output = settings.autoRedactSecrets 
      ? redactSecrets(context.recentOutput)
      : context.recentOutput;
    
    const truncated = output.length > 2000 ? '...' + output.slice(-2000) : output;
    
    lines.push('', '## Recent Terminal Output');
    lines.push('```');
    lines.push(truncated);
    lines.push('```');
  }

  return lines.join('\n');
}
