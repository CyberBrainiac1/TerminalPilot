import { RiskAssessment } from '../models/types';

interface RiskPattern {
  pattern: RegExp;
  level: 'moderate' | 'high' | 'critical';
  reason: string;
}

const RISK_PATTERNS: RiskPattern[] = [
  { pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?-r[a-zA-Z]*\s+[\/~]/, level: 'critical', reason: 'Recursive deletion from root or home' },
  { pattern: /rm\s+-rf?\s+\//, level: 'critical', reason: 'Removing root filesystem' },
  { pattern: /rm\s+-rf/, level: 'high', reason: 'Recursive force delete' },
  { pattern: /:(){ :|:& };:/, level: 'critical', reason: 'Fork bomb detected' },
  { pattern: /del\s+\/[sS]/, level: 'high', reason: 'Windows recursive delete' },
  { pattern: /format\s+[a-zA-Z]:/, level: 'critical', reason: 'Disk format command' },
  { pattern: /diskpart/, level: 'high', reason: 'Disk partition tool' },
  { pattern: /chmod\s+-R\s+[0-7]{3,4}\s+\//, level: 'high', reason: 'Recursive chmod on system paths' },
  { pattern: /chown\s+-R/, level: 'moderate', reason: 'Recursive ownership change' },
  { pattern: /curl\s+.*\|.*bash/, level: 'high', reason: 'Remote code execution via curl|bash' },
  { pattern: /wget\s+.*\|.*bash/, level: 'high', reason: 'Remote code execution via wget|bash' },
  { pattern: /curl\s+.*\|.*sh/, level: 'high', reason: 'Remote code execution via curl|sh' },
  { pattern: /systemctl\s+(stop|disable|mask)\s+(ssh|network|firewall)/, level: 'high', reason: 'Disabling critical services' },
  { pattern: /service\s+(ssh|network|firewall)\s+stop/, level: 'high', reason: 'Stopping critical services' },
  { pattern: /reg\s+(add|delete|import)\s+HKLM/, level: 'high', reason: 'System registry modification' },
  { pattern: /\.\s*\.ssh\/(authorized_keys|id_rsa|id_ed25519)/, level: 'high', reason: 'SSH credential access' },
  { pattern: /cat\s+~?\/\.gnupg/, level: 'high', reason: 'GPG key directory access' },
  { pattern: /dd\s+if=.*of=\/dev/, level: 'critical', reason: 'Direct disk write' },
  { pattern: /mkfs\./, level: 'critical', reason: 'Filesystem creation (destructive)' },
  { pattern: />\/dev\/sd[a-z]/, level: 'critical', reason: 'Writing to block device' },
  { pattern: /shutdown|reboot|halt|poweroff/, level: 'moderate', reason: 'System power command' },
  { pattern: /passwd\s+root/, level: 'high', reason: 'Changing root password' },
  { pattern: /sudo\s+su\s*(-|\s*$)/, level: 'moderate', reason: 'Escalating to root shell' },
  { pattern: /while\s+true|while\s*\(\s*true\s*\)/, level: 'moderate', reason: 'Potential infinite loop' },
  { pattern: />\s*\/etc\/passwd|>\s*\/etc\/shadow/, level: 'critical', reason: 'Overwriting system auth files' },
  { pattern: /iptables\s+-F|ufw\s+disable/, level: 'high', reason: 'Disabling firewall' },
  { pattern: /setenforce\s+0|setenforce\s+Permissive/, level: 'high', reason: 'Disabling SELinux' },
];

export function analyzeRisk(command: string): RiskAssessment {
  const reasons: string[] = [];
  const matchedPatterns: string[] = [];
  let highestLevel: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';

  const levelOrder = { safe: 0, moderate: 1, high: 2, critical: 3 };

  for (const rp of RISK_PATTERNS) {
    if (rp.pattern.test(command)) {
      reasons.push(rp.reason);
      matchedPatterns.push(rp.pattern.source);
      if (levelOrder[rp.level] > levelOrder[highestLevel]) {
        highestLevel = rp.level;
      }
    }
  }

  return {
    level: highestLevel,
    reasons,
    matchedPatterns,
  };
}
