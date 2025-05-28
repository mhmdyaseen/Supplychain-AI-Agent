import { useEffect, useState } from 'react'
import Icon from '@/components/ui/icon'
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer'
import { usePlaygroundStore } from '@/store'
import type { PlaygroundChatMessage } from '@/types/playground'
import Videos from './Multimedia/Videos'
import Images from './Multimedia/Images'
import Audios from './Multimedia/Audios'
import { memo } from 'react'
import AgentThinkingLoader from './AgentThinkingLoader'

interface MessageProps {
  message: PlaygroundChatMessage
}

const AgentMessage = ({ message }: MessageProps) => {
  const { streamingErrorMessage } = usePlaygroundStore()
  const [aaronVoice, setAaronVoice] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const selected =
        voices.find((v) => v.name.toLowerCase().includes('aaron') && v.lang === 'en-US') ||
        voices.find((v) => v.lang === 'en-US')
      setAaronVoice(selected || null)
    }

    // Load voices initially and on change
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()
  }, [])

  const handleSpeak = () => {
    let text = ''
    if (message.content) {
      text = message.content
    } else if (message.response_audio?.transcript) {
      text = message.response_audio.transcript
    } else {
      text = 'No message available'
    }

    const utterance = new SpeechSynthesisUtterance(text)
    if (aaronVoice) utterance.voice = aaronVoice
    utterance.rate = 1
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }

  let messageContent
  if (message.streamingError) {
    messageContent = (
      <p className="text-destructive">
        Oops! Something went wrong while streaming.{' '}
        {streamingErrorMessage ? (
          <>{streamingErrorMessage}</>
        ) : (
          'Please try refreshing the page or try again later.'
        )}
      </p>
    )
  } else if (message.content) {
    messageContent = (
      <div className="flex w-full flex-col gap-4">
        <MarkdownRenderer>{message.content}</MarkdownRenderer>
        {message.videos && message.videos.length > 0 && (
          <Videos videos={message.videos} />
        )}
        {message.images && message.images.length > 0 && (
          <Images images={message.images} />
        )}
        {message.audio && message.audio.length > 0 && (
          <Audios audio={message.audio} />
        )}
      </div>
    )
  } else if (message.response_audio) {
    if (!message.response_audio.transcript) {
      messageContent = (
        <div className="mt-2 flex items-start">
          <AgentThinkingLoader />
        </div>
      )
    } else {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>
            {message.response_audio.transcript}
          </MarkdownRenderer>
          {message.response_audio.content && message.response_audio && (
            <Audios audio={[message.response_audio]} />
          )}
        </div>
      )
    }
  } else {
    messageContent = (
      <div className="mt-2">
        <AgentThinkingLoader />
      </div>
    )
  }

  return (
    <div className="flex flex-row items-start gap-4 font-geist">
      <div className="flex-shrink-0">
        <Icon type="cohere" size="sm" className="rotate-90 color-primary" />
      </div>
      {messageContent}
      <div>
        <button onClick={handleSpeak}>
          <Icon type="audio" size="xs" />
        </button>
      </div>
    </div>
  )
}

const UserMessage = memo(({ message }: MessageProps) => {
  return (
    <div className="flex items-start pt-4 text-start max-md:break-words">
      <div className="flex flex-row gap-x-3">
        <p className="flex items-center gap-x-2 text-sm font-medium text-muted">
          <Icon type="user" size="sm" />
        </p>
        <div className="text-sm rounded-lg py-1 font-geist text-secondary">
          {message.content}
        </div>
      </div>
    </div>
  )
})

AgentMessage.displayName = 'AgentMessage'
UserMessage.displayName = 'UserMessage'
export { AgentMessage, UserMessage }
