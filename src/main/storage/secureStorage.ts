import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, randomUUID } from 'crypto';

const SERVICE = 'TerminalPilot';
const KEY_ID_FILE = 'key-id';

async function getKeytar(): Promise<typeof import('keytar') | null> {
  try {
    return await import('keytar');
  } catch {
    return null;
  }
}

function getOrCreateInstallationId(): string {
  try {
    const dir = join(app.getPath('userData'), 'secure');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const idPath = join(dir, KEY_ID_FILE);
    if (existsSync(idPath)) {
      return readFileSync(idPath, 'utf8').trim();
    }
    const id = randomUUID();
    writeFileSync(idPath, id, 'utf8');
    return id;
  } catch {
    // Last-resort fallback — should not be reached in normal operation
    return 'terminalpilot-fallback-' + process.pid;
  }
}

function getEncryptionKey(): Buffer {
  const installationId = getOrCreateInstallationId();
  return scryptSync(installationId, 'terminalpilot-salt', 32);
}

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = getEncryptionKey();
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getEncryptionKey();
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function getFallbackPath(): string {
  const dir = join(app.getPath('userData'), 'secure');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, 'secrets.json');
}

function readFallbackSecrets(): Record<string, string> {
  const path = getFallbackPath();
  if (!existsSync(path)) return {};
  try {
    const data = readFileSync(path, 'utf8');
    const parsed: Record<string, string> = JSON.parse(data) as Record<string, string>;
    return parsed;
  } catch {
    return {};
  }
}

function writeFallbackSecrets(secrets: Record<string, string>): void {
  writeFileSync(getFallbackPath(), JSON.stringify(secrets), 'utf8');
}

export async function setSecret(key: string, value: string): Promise<void> {
  const keytar = await getKeytar();
  if (keytar) {
    await keytar.setPassword(SERVICE, key, value);
    return;
  }
  const secrets = readFallbackSecrets();
  secrets[key] = encrypt(value);
  writeFallbackSecrets(secrets);
}

export async function getSecret(key: string): Promise<string | null> {
  const keytar = await getKeytar();
  if (keytar) {
    return keytar.getPassword(SERVICE, key);
  }
  const secrets = readFallbackSecrets();
  if (!secrets[key]) return null;
  try {
    return decrypt(secrets[key]);
  } catch {
    return null;
  }
}

export async function deleteSecret(key: string): Promise<void> {
  const keytar = await getKeytar();
  if (keytar) {
    await keytar.deletePassword(SERVICE, key);
    return;
  }
  const secrets = readFallbackSecrets();
  delete secrets[key];
  writeFallbackSecrets(secrets);
}
