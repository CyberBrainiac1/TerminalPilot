import { EventEmitter } from 'events';
import { ApprovalRequest } from '../models/types';
import { PtyManager } from '../terminal/ptyManager';

export class ApprovalManager extends EventEmitter {
  private queue: Map<string, ApprovalRequest> = new Map();
  private ptyManager: PtyManager;

  constructor(ptyManager: PtyManager) {
    super();
    this.ptyManager = ptyManager;
  }

  addRequest(request: ApprovalRequest): void {
    this.queue.set(request.id, request);
    this.emit('newRequest', request);
  }

  async approveAndRun(requestId: string, editedCommand?: string): Promise<void> {
    const request = this.queue.get(requestId);
    if (!request) throw new Error('Request not found');

    const command = editedCommand ?? request.proposal.command;
    const tabId = request.sessionContext.tabId;

    this.queue.delete(requestId);
    this.emit('approved', requestId, command);

    // Write command to PTY followed by enter
    this.ptyManager.writeToSession(tabId, command + '\r');
  }

  reject(requestId: string): void {
    const request = this.queue.get(requestId);
    if (!request) return;
    this.queue.delete(requestId);
    this.emit('rejected', requestId);
  }

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.queue.values());
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this.queue.get(id);
  }
}
