import { useCallback } from 'react'
import { type RunResponse } from '@/types/playground'

function processChunk(
  chunk: RunResponse,
  onChunk: (chunk: RunResponse) => void
) {
  onChunk(chunk)
}

function parseBuffer(
  buffer: string,
  onChunk: (chunk: RunResponse) => void
): string {
  let jsonStartIndex = buffer.indexOf('{')
  let jsonEndIndex = -1

  while (jsonStartIndex !== -1) {
    let braceCount = 0
    let inString = false

    for (let i = jsonStartIndex; i < buffer.length; i++) {
      const char = buffer[i]

      if (char === '"' && buffer[i - 1] !== '\\') {
        inString = !inString
      }

      if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') braceCount--
      }

      if (braceCount === 0) {
        jsonEndIndex = i
        break
      }
    }

    if (jsonEndIndex !== -1) {
      const jsonString = buffer.slice(jsonStartIndex, jsonEndIndex + 1)
      try {
        const parsed = JSON.parse(jsonString) as RunResponse
        processChunk(parsed, onChunk)
      } catch {
        break
      }
      buffer = buffer.slice(jsonEndIndex + 1).trim()
      jsonStartIndex = buffer.indexOf('{')
      jsonEndIndex = -1
    } else {
      break
    }
  }

  return buffer
}

export default function useAIResponseStream() {
  const streamResponse = useCallback(
    async (options: {
      apiUrl: string
      headers?: Record<string, string>
      requestBody: FormData | Record<string, unknown>
      onChunk: (chunk: RunResponse) => void
      onError: (error: Error) => void
      onComplete: () => void
    }): Promise<void> => {
      const {
        apiUrl,
        headers = {},
        requestBody,
        onChunk,
        onError,
        onComplete
      } = options

      let buffer = ''

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            ...(!(requestBody instanceof FormData) && {
              'Content-Type': 'application/json'
            }),
            ...headers
          },
          body:
            requestBody instanceof FormData
              ? requestBody
              : JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw errorData
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        const processStream = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            buffer = parseBuffer(buffer, onChunk)
            onComplete()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          buffer = parseBuffer(buffer, onChunk)
          await processStream()
        }
        await processStream()
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'detail' in error) {
          onError(new Error(String(error.detail)))
        } else {
          onError(new Error(String(error)))
        }
      }
    },
    []
  )

  return { streamResponse }
}
