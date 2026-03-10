import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import type { TerminalTab } from '../types'
import { useTerminalStore } from '../stores/terminalStore'
import { useSettingsStore } from '../stores/settingsStore'

interface TerminalPaneProps {
  tab: TerminalTab
  isActive: boolean
}

export function TerminalPane({ tab, isActive }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const initializedRef = useRef(false)
  const { updateTab } = useTerminalStore()
  const { settings } = useSettingsStore()

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    const term = new Terminal({
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      // Windows PowerShell / Campbell color scheme
      theme: {
        background:    '#012456',
        foreground:    '#EEEDF0',
        cursor:        '#FEEE65',
        cursorAccent:  '#012456',
        selectionBackground: '#1b4f8f',
        black:         '#0C0C0C',
        red:           '#C50F1F',
        green:         '#13A10E',
        yellow:        '#C19C00',
        blue:          '#0037DA',
        magenta:       '#881798',
        cyan:          '#3A96DD',
        white:         '#CCCCCC',
        brightBlack:   '#767676',
        brightRed:     '#E74856',
        brightGreen:   '#16C60C',
        brightYellow:  '#F9F1A5',
        brightBlue:    '#3B78FF',
        brightMagenta: '#B4009E',
        brightCyan:    '#61D6D6',
        brightWhite:   '#F2F2F2',
      },
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: settings.scrollback,
      allowTransparency: false,
      convertEol: false,
      windowsMode: true,
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(searchAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    const { cols, rows } = term

    if (tab.type === 'local') {
      window.electronAPI.terminal
        .create(tab.id, tab.shellProfile, { cols, rows })
        .then((pid) => {
          updateTab(tab.id, { pid })
        })
        .catch((err) => {
          term.writeln(`\r\n\x1b[31mFailed to start terminal: ${String(err)}\x1b[0m\r\n`)
        })

      // Listen to PTY output for this tab
      const removeListener = window.electronAPI.terminal.onData(tab.id, (data: string) => {
        term.write(data)
      })

      // Handle user input
      const inputDisposable = term.onData((data) => {
        window.electronAPI.terminal.write(tab.id, data).catch(console.error)
      })

      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
          const { cols: c, rows: r } = termRef.current!
          window.electronAPI.terminal.resize(tab.id, c, r).catch(console.error)
        }
      })
      if (containerRef.current) resizeObserver.observe(containerRef.current)

      return () => {
        inputDisposable.dispose()
        removeListener()
        resizeObserver.disconnect()
        term.dispose()
        initializedRef.current = false
      }
    } else {
      // SSH tab - listen to SSH data
      window.electronAPI.ssh.onData((sessionId: string, data: string) => {
        if (sessionId === tab.sshProfile?.id) {
          term.write(data)
        }
      })

      const inputDisposable = term.onData((data) => {
        if (tab.sshProfile) {
          window.electronAPI.ssh.write(tab.sshProfile.id, data).catch(console.error)
        }
      })

      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
          const { cols: c, rows: r } = termRef.current!
          if (tab.sshProfile) {
            window.electronAPI.ssh.resize(tab.sshProfile.id, c, r).catch(console.error)
          }
        }
      })
      if (containerRef.current) resizeObserver.observe(containerRef.current)

      return () => {
        inputDisposable.dispose()
        resizeObserver.disconnect()
        term.dispose()
        initializedRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  // Fit on becoming active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 30)
    }
  }, [isActive])

  return (
    <div
      ref={containerRef}
      className="terminal-container w-full h-full"
      style={{ display: isActive ? 'block' : 'none' }}
    />
  )
}
