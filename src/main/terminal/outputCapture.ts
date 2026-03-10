export class OutputCapture {
  private buffers: Map<string, string[]> = new Map();
  private maxLines: number;

  constructor(maxLines = 500) {
    this.maxLines = maxLines;
  }

  append(tabId: string, data: string): void {
    if (!this.buffers.has(tabId)) {
      this.buffers.set(tabId, []);
    }
    const lines = data.split(/\r?\n/);
    const buf = this.buffers.get(tabId)!;
    for (const line of lines) {
      buf.push(line);
    }
    // trim to maxLines
    if (buf.length > this.maxLines) {
      buf.splice(0, buf.length - this.maxLines);
    }
  }

  getRecentOutput(tabId: string, lines = 50): string {
    const buf = this.buffers.get(tabId);
    if (!buf) return '';
    return buf.slice(-lines).join('\n');
  }

  clear(tabId: string): void {
    this.buffers.delete(tabId);
  }

  clearAll(): void {
    this.buffers.clear();
  }
}
