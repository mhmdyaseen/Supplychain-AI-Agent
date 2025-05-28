'use client'

import { useState } from 'react'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import useChatActions from '@/hooks/useChatActions'

const ChatInput = () => {
  const { chatInputRef } = usePlaygroundStore()
  const [inputMessage, setInputMessage] = useState('')
  const isStreaming = usePlaygroundStore((state) => state.isStreaming)
  const currentSessionId = usePlaygroundStore((state) => state.currentSessionId)
  const { sendMessage } = useChatActions()

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isStreaming) return

    const message = inputMessage.trim()
    setInputMessage('')

    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Error sending message:', error)
      setInputMessage(message) 
    }
  }

  return (
    <div className="relative mx-auto mb-1 flex w-full max-w-2xl items-end justify-center gap-x-2 font-geist">
      <TextArea
        placeholder="Ask anything"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            !e.nativeEvent.isComposing &&
            !e.shiftKey &&
            !isStreaming
          ) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="w-full border border-accent bg-primaryAccent px-4 text-sm text-primary focus:border-accent"
        ref={chatInputRef}
      />
      <Button
        onClick={handleSubmit}
        disabled={!inputMessage.trim() || isStreaming}
        size="icon"
        className="rounded-xl bg-primary p-5 text-primaryAccent"
      >
        <Icon type="send" color="primaryAccent" />
      </Button>
    </div>
  )
}

export default ChatInput
