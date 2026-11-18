// src/hooks/useDashboard.js
import { useState } from 'react'

const useDashboard = () => {
  const [stats] = useState(null)
  return { stats }
}

export default useDashboard
