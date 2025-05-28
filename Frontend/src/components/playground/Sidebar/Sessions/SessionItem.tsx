import { useQueryState } from 'nuqs'
import { SessionEntry } from '@/types/playground'
import { Button } from '../../../ui/button'
import useSessionLoader from '@/hooks/useSessionLoader'
import { deletePlaygroundSessionAPI } from '@/api/playground'
import { usePlaygroundStore } from '@/store'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'
import { useState } from 'react'
import DeleteSessionModal from './DeleteSessionModal'
import { truncateText, cn } from '@/lib/utils'

type SessionItemProps = SessionEntry & {
  isSelected: boolean
  onSessionClick: () => void
  isNewChat?: boolean
}
const SessionItem = ({
  title,
  session_id,
  isSelected,
  onSessionClick,
  isNewChat = false
}: SessionItemProps) => {
  const [agentId] = useQueryState('agent')
  const [, setNuqsSessionId] = useQueryState('session')
  const {
    sessionsData,
    setSessionsData,
    setCurrentSessionId,
    clearChat,
    currentSessionId
  } = usePlaygroundStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleGetSession = async () => {
    onSessionClick() 

    if (isNewChat) {
      clearChat() 
      setNuqsSessionId(null) 
    } else if (session_id) {
      setCurrentSessionId(session_id)
      setNuqsSessionId(session_id) // Set session in URL query params
      // ChatArea.tsx useEffect will now pick up currentSessionId and fetch messages
    }
  }

  const handleDeleteSession = async () => {
    if (isNewChat || !session_id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/delete-session/${session_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSessionsData((prevSessions) =>
          prevSessions ? prevSessions.filter((session) => session.session_id !== session_id) : []
        );

        if (currentSessionId === session_id) {
          clearChat(); 
          setNuqsSessionId(null); // Clear from URL
        }
        toast.success('Session deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('An error occurred while deleting the session.');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 mb-0.5 transition-colors duration-200 rounded-[12px] bg-white/80 text-black/70',
          isSelected
            ? 'bg-white/100 shadow-md' 
            : 'hover:bg-white/55'
        )}
        onClick={handleGetSession}
      >
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              'text-sm font-medium',
              isSelected ? 'text-black font-semibold' : 'text-gray-700' 
            )}
          >
            {truncateText(title, 20)}
          </div>
        </div>
        {!isNewChat && (
          <Button
            variant="ghost"
            size="icon"
            className="transform opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
          >
            <Icon type="trash" size="xs" className="text-gray-400 group-hover:text-black" />
          </Button>
        )}
      </div>
      {!isNewChat && (
        <DeleteSessionModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteSession}
          isDeleting={false} 
        />
      )}
    </>
  )
}

export default SessionItem