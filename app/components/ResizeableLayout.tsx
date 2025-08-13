"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { GripVertical } from "lucide-react"

interface ResizableLayoutProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  initialLeftWidth?: number
  minWidth?: number
  maxWidth?: number
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  rightPanel,
  initialLeftWidth = 50,
  minWidth = 25,
  maxWidth = 75,
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Keep the width within bounds
      const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newLeftWidth))
      setLeftWidth(clampedWidth)
    },
    [isResizing, minWidth, maxWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* Left Panel */}
      <div className="relative backdrop-blur-sm overflow-hidden" style={{ width: `${leftWidth}%` }}>
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className={`
          relative w-1 bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-blue-500/30 
          hover:w-2 hover:bg-gradient-to-b hover:from-blue-500/60 hover:via-purple-500/60 hover:to-blue-500/60
          cursor-col-resize transition-all duration-200 flex items-center justify-center group
          ${isResizing ? "w-2 bg-gradient-to-b from-blue-500/80 via-purple-500/80 to-blue-500/80 glow-effect" : ""}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Grip Icon */}
        <div className="absolute inset-y-0 flex items-center justify-center">
          <GripVertical
            className={`
              w-3 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200
              ${isResizing ? "opacity-100 text-blue-400" : ""}
            `}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="relative backdrop-blur-sm overflow-hidden" style={{ width: `${100 - leftWidth}%` }}>
        {rightPanel}
      </div>
    </div>
  )
}

export default ResizableLayout
