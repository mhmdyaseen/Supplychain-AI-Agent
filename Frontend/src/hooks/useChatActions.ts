import { useCallback } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '../store'
import { useQueryState } from 'nuqs'
import { v4 as uuidv4 } from 'uuid'
import useSessionLoader from './useSessionLoader'
import { ComboboxAgent, PlaygroundChatMessage } from '@/types/playground'
import {
  getPlaygroundAgentsAPI,
  getPlaygroundStatusAPI
} from '@/api/playground'

const useChatActions = () => {
  const { chatInputRef } = usePlaygroundStore()
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const [, setSessionId] = useQueryState('session')
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setIsEndpointActive = usePlaygroundStore((state) => state.setIsEndpointActive)
  const setIsEndpointLoading = usePlaygroundStore((state) => state.setIsEndpointLoading)
  const setAgents = usePlaygroundStore((state) => state.setAgents)
  const setSelectedModel = usePlaygroundStore((state) => state.setSelectedModel)
  const [agentId, setAgentId] = useQueryState('agent')
  const currentSessionId = usePlaygroundStore((state) => state.currentSessionId)
  const { getSessions } = useSessionLoader()

  const getStatus = useCallback(async () => {
    try {
      const status = await getPlaygroundStatusAPI(selectedEndpoint)
      return status
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async () => {
    try {
      const agents = await getPlaygroundAgentsAPI(selectedEndpoint)
      return agents
    } catch {
      toast.error('Error fetching agents')
      return []
    }
  }, [selectedEndpoint])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [setMessages, setSessionId])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
  }, [chatInputRef])

  const addMessage = useCallback(
    (message: PlaygroundChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  const sendMessage = useCallback(async (text: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          session_id: currentSessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Update messages in the chat
      setMessages(prev => [...prev, data.user_message, data.agent_message])
      
      // Refresh the sessions list to show the new session
      await getSessions()
      
      return data
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }, [currentSessionId, setMessages, getSessions])

  const initializePlayground = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        agents = await getAgents()
        if (agents.length > 0 && !agentId) {
          const firstAgent = agents[0]
          setAgentId(firstAgent.value)
          setSelectedModel(firstAgent.model.provider || '')
        }
      } else {
        setIsEndpointActive(false)
      }
      setAgents(agents)
      return agents
    } catch {
      setIsEndpointLoading(false)
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setAgentId,
    setSelectedModel,
    agentId
  ])

  return {
    clearChat,
    focusChatInput,
    addMessage,
    initializePlayground,
    sendMessage
  }
}

export default useChatActions