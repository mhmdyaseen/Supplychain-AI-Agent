'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import SessionItem from './SessionItem'
import useSessionLoader from '@/hooks/useSessionLoader'

import { cn } from '@/lib/utils'
import { FC } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonListProps {
  skeletonCount: number
}


const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  return skeletons.map((skeleton, index) => (
    <Skeleton
      key={skeleton}
      className={cn(
        'mb-1 h-11 rounded-lg px-3 py-2',
        index > 0 && 'bg-background-secondary'
      )}
    />
  ))
}

dayjs.extend(utc)

const formatDate = (
  timestamp: number,
  format: 'natural' | 'full' = 'full'
): string => {
  const date = dayjs.unix(timestamp).utc()
  return format === 'natural'
    ? date.format('HH:mm')
    : date.format('YYYY-MM-DD HH:mm:ss')
}

const Sessions = () => {
  const [agentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [sessionId, setSessionId] = useQueryState('session')
  const {
    selectedEndpoint, 
    isEndpointActive, 
    isEndpointLoading, 
    sessionsData,      
    hydrated,
    hasStorage,        
    messages,
    isSessionsLoading,
    setCurrentSessionId, 
    clearChat         
  } = usePlaygroundStore()
  const [isScrolling, setIsScrolling] = useState(false)
  const [selectedSessionIdLocally, setSelectedSessionIdLocally] = useState<string | null>(null); // For local UI selection indication
  const { getSession, getSessions } = useSessionLoader()
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (hydrated) {
      getSessions(agentId || ''); 
    }
  }, [hydrated, agentId, getSessions]);

  const handleScroll = () => {
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (sessionId && agentId && selectedEndpoint && hydrated) {
      setCurrentSessionId(sessionId); // Ensure store knows the current session
    }
  }, [hydrated, sessionId, agentId, selectedEndpoint, getSession, setCurrentSessionId])

  useEffect(() => {
    if (!selectedEndpoint || !agentId || !hasStorage) {
      // setSessionsData(() => null); // Be cautious with clearing store data here
      return
    }
    if (!isEndpointLoading) {
      // setSessionsData(() => null);
      // getSessions(agentId); // This was likely the problematic duplicate call
    }
  }, [
    selectedEndpoint,
    agentId,
    isEndpointLoading,
    hasStorage,
  ])

  useEffect(() => {
    if (sessionId) {
      setSelectedSessionIdLocally(sessionId)
      setCurrentSessionId(sessionId);
    } else {
      setSelectedSessionIdLocally(null);
    }
  }, [sessionId, setCurrentSessionId])

  const formattedSessionsData = useMemo(() => {
    if (!sessionsData || !Array.isArray(sessionsData)) return []
    return sessionsData.map((entry) => ({
      ...entry,
      formatted_time: formatDate(entry.created_at, 'natural')
    }))
  }, [sessionsData])

  const handleSessionClick = useCallback(
    (id: string) => () => {
      setSessionId(id); 
    },
    [setSessionId]
  );

  const hasActiveChat = messages.length > 0 && sessionId && !formattedSessionsData.some(session => session.session_id === sessionId);
  const currentSessionTitle = messages.length > 0 && messages[0].content ? messages[0].content.substring(0, 30) : 'New Chat';

  const handleNewChat = useCallback(() => {
    clearChat();        // Clears messages and currentSessionId in the store
    setSessionId(null); // Clears session from URL, triggers useEffect to update local selection state
  }, [setSessionId, clearChat]);

  if (isSessionsLoading || !hydrated)
    return (
      <div className="w-full">
        <div className="mb-2 text-xs font-medium uppercase">Sessions</div>
        <div className="mt-4 h-[calc(100vh-325px)] w-full overflow-y-auto">
          <SkeletonList skeletonCount={1} />
        </div>
      </div>
    )

  return (
    <div className="w-full">
      <div className="mb-2 w-full text-xs font-medium uppercase text-black">Your Chats</div>
      <div
        className={`h-[calc(100vh-345px)] overflow-y-auto font-geist transition-all duration-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-300 ${isScrolling ? '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-background [&::-::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:opacity-0' : '[&::-webkit-scrollbar]:opacity-100'}`}
        onScroll={handleScroll}
        onMouseOver={() => setIsScrolling(true)}
        onMouseLeave={handleScroll}
      >
        <div className='flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden scrollbar-none' onScroll={handleScroll}>

          {formattedSessionsData.map((session) => (
            <SessionItem
              key={session.session_id}
              {...session} // Spread all properties from the session entry
              isSelected={selectedSessionIdLocally === session.session_id}
              onSessionClick={handleSessionClick(session.session_id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sessions