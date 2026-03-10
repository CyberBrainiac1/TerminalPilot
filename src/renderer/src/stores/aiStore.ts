import { create } from 'zustand'
import type { ChatMessage, CommandProposal, ApprovalRequest } from '../types'

let _msgCounter = 0
function newMsgId(): string {
  return `msg-${++_msgCounter}-${Date.now()}`
}

let _propCounter = 0
function newPropId(): string {
  return `prop-${++_propCounter}-${Date.now()}`
}

interface AIState {
  messages: ChatMessage[]
  approvalQueue: ApprovalRequest[]
  isLoading: boolean
  sidebarOpen: boolean
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  addProposal: (msgId: string, proposal: Omit<CommandProposal, 'id'>) => CommandProposal
  updateProposal: (proposalId: string, updates: Partial<CommandProposal>) => void
  addToQueue: (req: ApprovalRequest) => void
  removeFromQueue: (id: string) => void
  clearChat: () => void
  setLoading: (v: boolean) => void
  setSidebarOpen: (v: boolean) => void
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  approvalQueue: [],
  isLoading: false,
  sidebarOpen: true,

  addMessage: (msg) => {
    const message: ChatMessage = { ...msg, id: newMsgId(), timestamp: Date.now() }
    set((state) => ({ messages: [...state.messages, message] }))
    return message
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
  },

  addProposal: (msgId, proposal) => {
    const full: CommandProposal = { ...proposal, id: newPropId() }
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === msgId ? { ...m, commandProposals: [...(m.commandProposals ?? []), full] } : m
      ),
    }))
    return full
  },

  updateProposal: (proposalId, updates) => {
    set((state) => ({
      messages: state.messages.map((m) => ({
        ...m,
        commandProposals: m.commandProposals?.map((p) =>
          p.id === proposalId ? { ...p, ...updates } : p
        ),
      })),
    }))
  },

  addToQueue: (req) => set((state) => ({ approvalQueue: [...state.approvalQueue, req] })),
  removeFromQueue: (id) =>
    set((state) => ({ approvalQueue: state.approvalQueue.filter((r) => r.id !== id) })),
  clearChat: () => set({ messages: [], approvalQueue: [] }),
  setLoading: (v) => set({ isLoading: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
