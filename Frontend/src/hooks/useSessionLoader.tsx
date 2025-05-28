import { useCallback } from 'react'
import {
  getPlaygroundSessionAPI,
  getAllPlaygroundSessionsAPI
} from '@/api/playground'
import { usePlaygroundStore } from '../store'
import { toast } from 'sonner'
import {
  PlaygroundChatMessage,
  ToolCall,
  ReasoningMessage,
  ChatEntry
} from '@/types/playground'
import { getJsonMarkdown } from '@/lib/utils'

interface SessionResponse {
  session_id: string
  title: string 
  user_id: string | null
  username: string
  messages: Array<{
    role: string
    content: string
    created_at: number
  }>
}

const useSessionLoader = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setIsSessionsLoading = usePlaygroundStore(
    (state) => state.setIsSessionsLoading
  )
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)

  const getSessions = useCallback(
    async (_agentId?: string) => { 
      try {
        setIsSessionsLoading(true)
        const sessions = await getAllPlaygroundSessionsAPI() 
        if (Array.isArray(sessions)) {
          setSessionsData(() => sessions) // Use function form to set sessions
        } else {
          console.error('Received invalid sessions data:', sessions)
          toast.error('Error loading sessions: Invalid data format')
          setSessionsData(() => [])
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
        toast.error('Error loading sessions')
        setSessionsData(() => [])
      } finally {
        setIsSessionsLoading(false)
      }
    },
    [setSessionsData, setIsSessionsLoading]
  )

  const getSession = useCallback(
    async (sessionId: string, _agentId?: string) => {
      if (!sessionId) {
        return null
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('Authentication required')
          return null
        }

        const response = await fetch(`http://localhost:8000/chats/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch session chats')
        }

        const chats = await response.json()
        
        if (Array.isArray(chats)) {
          setMessages(() => chats)
          return chats
        }
        
        throw new Error('Invalid response format')
      } catch (error) {
        console.error('Error fetching session:', error)
        toast.error('Failed to load session messages')
        return null
      }
    },
    [setMessages]
  )

  return { getSession, getSessions }
}

export default useSessionLoader


