import React, { useRef, useCallback } from 'react'

interface SplitPaneManagerProps {
  left: React.ReactNode
  right?: React.ReactNode
  rightWidth: number
  onRightWidthChange: (w: number) => void
  showRight: boolean
}

export function SplitPaneManager({
  left,
  right,
  rightWidth,
  onRightWidthChange,
  showRight,
}: SplitPaneManagerProps) {
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = rightWidth

      const onMouseMove = (ev: MouseEvent) => {
        const delta = startXRef.current - ev.clientX
        const newWidth = Math.max(240, Math.min(640, startWidthRef.current + delta))
        onRightWidthChange(newWidth)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [rightWidth, onRightWidthChange]
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden">{left}</div>
      {showRight && (
        <>
          <div className="resize-handle" onMouseDown={onMouseDown} />
          <div style={{ width: rightWidth }} className="flex flex-col min-h-0 overflow-hidden shrink-0">
            {right}
          </div>
        </>
      )}
    </div>
  )
}
