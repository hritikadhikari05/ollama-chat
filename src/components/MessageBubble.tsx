"use client"

import { Bot, Check, Copy, User } from "lucide-react"
import React, { useState } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface MessageBubbleProps {
  message: Message
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user"
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const formatMessage = (content: string) => {
    // Handle multi-line code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const codeBlocks: { id: string; language: string; content: string }[] = []
    let codeBlockIndex = 0

    // Extract code blocks and replace with placeholders
    let processedContent = content.replace(
      codeBlockRegex,
      (match, language, codeContent) => {
        const blockId = `code-block-${message.id}-${codeBlockIndex++}`
        codeBlocks.push({
          id: blockId,
          language: language || "",
          content: codeContent.trim(),
        })
        return `__CODE_BLOCK_${blockId}__`
      }
    )

    // Split content into lines for processing
    const lines = processedContent.split("\n")
    const formattedLines = lines.map((line, lineIndex) => {
      // Handle code block placeholders
      if (line.includes("__CODE_BLOCK_")) {
        const blockId = line.match(/__CODE_BLOCK_(.*?)__/)?.[1]
        if (!blockId) return null
        const codeBlock = codeBlocks.find((block) => block.id === blockId)
        if (codeBlock) {
          return (
            <div key={lineIndex} className="my-3">
              <div className="bg-gray-800 rounded-lg p-4 relative group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 uppercase font-mono">
                    {codeBlock.language || "code"}
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeBlock.content, blockId)}
                    className="p-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600 transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === blockId ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <pre className="text-sm text-green-400 font-mono overflow-x-auto whitespace-pre">
                  <code>{codeBlock.content}</code>
                </pre>
              </div>
            </div>
          )
        }
      }

      // Handle headings
      if (line.startsWith("# ")) {
        return (
          <h1 key={lineIndex} className="text-2xl font-bold text-gray-900 mb-2">
            {line.substring(2)}
          </h1>
        )
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={lineIndex} className="text-xl font-bold text-gray-900 mb-2">
            {line.substring(3)}
          </h2>
        )
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={lineIndex} className="text-lg font-bold text-gray-900 mb-1">
            {line.substring(4)}
          </h3>
        )
      }

      // Handle inline formatting
      let formattedLine = line

      // Bold text
      formattedLine = formattedLine.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      )

      // Inline code
      formattedLine = formattedLine.replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      )

      // Regular paragraphs
      if (line.trim() === "") {
        return <br key={lineIndex} />
      }

      return (
        <p
          key={lineIndex}
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      )
    })

    return formattedLines
  }

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } animate-fade-in`}
    >
      <div
        className={`flex max-w-3xl ${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-start space-x-3 ${isUser ? "space-x-reverse" : ""}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`px-4 py-3 rounded-2xl max-w-md lg:max-w-2xl ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          <div className="prose prose-sm max-w-none">
            {formatMessage(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-typing-cursor"></span>
            )}
          </div>
          <p
            className={`text-xs mt-2 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {message.isStreaming && (
              <span className="ml-2 text-blue-500">typing...</span>
            )}
            {!isUser && <span className="ml-2 text-gray-400">• DevTacks</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
