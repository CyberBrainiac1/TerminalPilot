import { useCallback } from 'react'
import { useAIStore } from '../stores/aiStore'
import { useTerminalStore } from '../stores/terminalStore'
import type { CommandProposal } from '../types'

function extractCodeBlocks(text: string): Array<{ command: string }> {
  const results: Array<{ command: string }> = []
  const regex = /```(?:bash|powershell|cmd|shell|sh|ps1|ps)?\n?([\s\S]*?)```/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const command = match[1].trim()
    if (command && command.length < 1000) {
      results.push({ command })
    }
  }
  return results
}

export function useAI() {
  const aiStore = useAIStore()
  const terminalStore = useTerminalStore()

  const sendMessage = useCallback(
    async (userText: string, includeOutput = false) => {
      if (!userText.trim()) return
      aiStore.addMessage({ role: 'user', content: userText })
      aiStore.setLoading(true)

      const activeTab = terminalStore.tabs.find((t) => t.isActive)
      let recentOutput: string | undefined

      if (includeOutput && activeTab) {
        try {
          recentOutput = await window.electronAPI.terminal.getOutput(activeTab.id, 50)
        } catch { /* ignore */ }
      }

      const sessionContext = activeTab
        ? {
            tabId: activeTab.id,
            type: activeTab.type,
            shell: activeTab.shellProfile?.name,
            cwd: activeTab.cwd,
            hostname: activeTab.sshProfile?.host,
            recentOutput,
          }
        : { tabId: '', type: 'local' as const }

      const assistantMsg = aiStore.addMessage({ role: 'assistant', content: '' })

      try {
        const apiMessages = aiStore.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .filter((m) => m.content)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        const result = await window.electronAPI.ai.chat(apiMessages, sessionContext)

        // Parse command proposals from code blocks
        const blocks = extractCodeBlocks(result)
        const proposals: CommandProposal[] = []

        for (const block of blocks) {
          const riskResult = await window.electronAPI.security.analyzeRisk(block.command).catch(() => ({
            level: 'safe',
            reasons: [],
            matchedPatterns: [],
          }))
          const proposal = aiStore.addProposal(assistantMsg.id, {
            command: block.command,
            explanation: '',
            riskLevel: riskResult.level as CommandProposal['riskLevel'],
            riskReason: riskResult.reasons[0],
            status: 'pending',
          })
          proposals.push(proposal)
        }

        // Strip code blocks from displayed text
        const displayContent = blocks.length > 0
          ? result.replace(/```[\s\S]*?```/g, '').trim() || result
          : result

        aiStore.updateMessage(assistantMsg.id, {
          content: displayContent,
          commandProposals: proposals.length > 0 ? proposals : undefined,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        aiStore.updateMessage(assistantMsg.id, { content: `❌ Error: ${msg}` })
      } finally {
        aiStore.setLoading(false)
      }
    },
    [aiStore, terminalStore]
  )

  const approveProposal = useCallback(
    async (proposalId: string, editedCommand?: string) => {
      const activeTab = terminalStore.tabs.find((t) => t.isActive)
      if (!activeTab) return

      // Find the proposal command
      let commandToRun = editedCommand
      for (const msg of aiStore.messages) {
        for (const p of msg.commandProposals ?? []) {
          if (p.id === proposalId) {
            commandToRun = editedCommand ?? p.command
            break
          }
        }
      }
      if (!commandToRun) return

      aiStore.updateProposal(proposalId, { status: 'running', editedCommand })

      try {
        // Write command to the active terminal + newline
        await window.electronAPI.terminal.write(activeTab.id, commandToRun + '\r')
        // Wait briefly for output
        await new Promise((resolve) => setTimeout(resolve, 500))
        const output = await window.electronAPI.terminal.getOutput(activeTab.id, 20).catch(() => '')
        aiStore.updateProposal(proposalId, { status: 'completed', output })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        aiStore.updateProposal(proposalId, { status: 'failed', output: msg })
      }
    },
    [aiStore, terminalStore]
  )

  const rejectProposal = useCallback(
    (proposalId: string) => {
      aiStore.updateProposal(proposalId, { status: 'rejected' })
    },
    [aiStore]
  )

  return { ...aiStore, sendMessage, approveProposal, rejectProposal }
}
