"use client"

import { useState, useEffect } from "react"

export function useResponsiveLayout(width: number) {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    // Consider a panel narrow if it's less than 30% of the total width
    setIsNarrow(width < 30)
  }, [width])

  return { isNarrow }
}
