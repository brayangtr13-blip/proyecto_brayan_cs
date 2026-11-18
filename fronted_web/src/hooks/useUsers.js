// src/hooks/useUsers.js
import { useState } from 'react'

const useUsers = () => {
  const [users] = useState([])
  return { users }
}

export default useUsers
