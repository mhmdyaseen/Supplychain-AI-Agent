import { toast } from 'sonner'
import dayjs from 'dayjs'

import { APIRoutes } from './routes'

import { Agent, ComboboxAgent, SessionEntry } from '@/types/playground'

export const getPlaygroundAgentsAPI = async (
  endpoint: string
): Promise<ComboboxAgent[]> => {
  const url = APIRoutes.GetPlaygroundAgents(endpoint)
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()

    const agents: ComboboxAgent[] = data.map((item: Agent) => ({
      value: item.agent_id || '',
      label: item.name || '',
      model: item.model || '',
      storage: item.storage || false
    }))
    return agents
  } catch {
    toast.error('Error fetching playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  const response = await fetch(APIRoutes.PlaygroundStatus(base), {
    method: 'GET'
  })
  return response.status
}

interface SessionOutBE {
  session_id: string
  username: string
  session_name: string
  created_at: string // ISO datetime string from backend
}

export const getAllPlaygroundSessionsAPI = async (): Promise<SessionEntry[]> => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('No token found for fetching sessions.')
    toast.error('Authentication required')
    return []
  }

  try {
    const response = await fetch(`http://localhost:8000/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: 'Failed to fetch sessions from server'
      }))
      console.error('Failed to fetch sessions:', errorData.detail || response.statusText)
      toast.error('Failed to load sessions')
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('Invalid sessions data format:', data)
      toast.error('Invalid sessions data format')
      return []
    }

    return data.map((session: SessionOutBE) => ({
      session_id: session.session_id,
      title: session.session_name, 
      created_at: dayjs(session.created_at).unix() 
    }))
  } catch (error) {
    console.error('Error fetching or processing sessions:', error)
    toast.error('Error loading sessions')
    return []
  }
}

export const getPlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.GetPlaygroundSession(base, agentId, sessionId),
    {
      method: 'GET'
    }
  )
  return response.json()
}

export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeletePlaygroundSession(base, agentId, sessionId),
    {
      method: 'DELETE'
    }
  )
  return response
}
