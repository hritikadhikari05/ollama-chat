"use client"

import { Bot, MessageSquare, Send } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import LoadingIndicator from "./LoadingIndicator"
import MessageBubble from "./MessageBubble"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      // Use Next.js API route
      const apiUrl = "/api/chat"

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify({
          model: "gemma3:4b",
          messages: [
            {
              role: "system",
              content:
                "You are a Senior Designer at DevTacks company. You specialize in UI/UX design, design systems, and creating exceptional user experiences. Format your responses with: **bold** for emphasis, `inline code` for design tools/terms, ```code blocks``` for CSS/design code, and use different heading levels (# ## ###) for structure. Always be creative, user-focused, and design-driven.",
            },
            {
              role: "user",
              content: userMessage.content,
            },
          ],
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        )
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Handle the case where multiple JSON objects are concatenated
        let buffer = chunk

        // Try to extract complete JSON objects from the buffer
        while (buffer.length > 0) {
          try {
            // Find the end of the first JSON object
            let braceCount = 0
            let endIndex = -1

            for (let i = 0; i < buffer.length; i++) {
              if (buffer[i] === "{") braceCount++
              if (buffer[i] === "}") {
                braceCount--
                if (braceCount === 0) {
                  endIndex = i + 1
                  break
                }
              }
            }

            if (endIndex === -1) {
              // Incomplete JSON, wait for more data
              break
            }

            // Extract the complete JSON object
            const jsonStr = buffer.substring(0, endIndex)
            const parsed = JSON.parse(jsonStr)

            // Process the parsed object
            if (parsed.message?.content) {
              accumulatedContent += parsed.message.content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              )
            }

            // Remove the processed JSON from buffer
            buffer = buffer.substring(endIndex)
          } catch (parseError) {
            console.warn(
              "Failed to parse JSON object:",
              buffer.substring(0, 100),
              parseError
            )
            // Skip to next potential JSON start
            const nextBrace = buffer.indexOf("{", 1)
            if (nextBrace === -1) break
            buffer = buffer.substring(nextBrace)
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      )
    } catch (err) {
      console.error("Full error details:", err)

      // Handle abort error
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Request cancelled.",
                  isStreaming: false,
                }
              : msg
          )
        )
        return
      }

      // Update the assistant message with error content
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error while generating a response.",
                isStreaming: false,
              }
            : msg
        )
      )

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Network error: Unable to connect to Ollama server. Please check if the server is running and accessible."
        )
      } else {
        setError(
          `Ollama API Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">DevTacks</h1>
            <p className="text-sm text-gray-500">
              Senior Designer • Powered by Ollama
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <MessageSquare className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Ollama Chat
            </h2>
            <p className="text-gray-600 max-w-md">
              Start a conversation with your local AI model. Ask questions, get
              help, or just chat!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading &&
              messages.length > 0 &&
              !messages.some((msg) => msg.isStreaming) && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="mx-auto max-w-2xl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              />
            </div>
            {isLoading ? (
              <button
                onClick={cancelRequest}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center min-w-[48px]"
                title="Cancel request"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[48px]"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Connected to Ollama
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
