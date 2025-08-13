"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User } from "lucide-react"
import { useTasks } from "../contexts/TaskContext"

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

// System message to instruct the AI about task management
const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a helpful AI assistant that manages tasks. Your primary functions are:
  1. Add tasks when users request them
  2. Respond conversationally to other queries
  3. Help users manage their time and tasks effectively

  When users mention anything about tasks, to-dos, or reminders:
  1. Extract the task details from their message
  2. Respond confirming what you've added
  3. Be friendly and helpful

  Examples:
  User: "Hello can you add a task to my list"
  Response: "I'd be happy to add a task! What would you like me to add?"

  User: "Add getting coffee"
  Response: "I've added 'getting coffee' to your task list! Is there anything else you'd like me to add?"

  User: "Remind me to call mom tomorrow"
  Response: "I've added 'call mom tomorrow' to your tasks. Would you like me to add any more details to this task?"

  Always try to be helpful and extract tasks from user messages, even if they don't use exact phrases like 'add task' or 'create task'.`
}

export default function AiChat() {
  const { addTask } = useTasks()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractAndAddTask = (content: string) => {
    // Remove common task-related phrases
    const cleanContent = content.toLowerCase()
      .replace(/^(can you |please |could you |would you )/i, '')
      .replace(/^(add|create|make|put|set|remind me|add to|put on|set up|create a|add a|make a) (task|reminder|to-do|todo|to do|in my list|to my list|on my list)?/i, '')
      .replace(/[?.!]/g, '')
      .trim()

    if (cleanContent) {
      addTask(cleanContent)
      return true
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)
    const userMessage = { role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [SYSTEM_MESSAGE, ...messages, userMessage],
          max_tokens: 2048,
          temperature: 0.7
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.choices?.[0]?.message) {
        const aiMessage = data.choices[0].message
        setMessages(prev => [...prev, aiMessage])

        // Try to extract and add task from user message
        const lowerContent = userMessage.content.toLowerCase()
        if (
          lowerContent.includes('task') ||
          lowerContent.includes('remind') ||
          lowerContent.includes('todo') ||
          lowerContent.includes('to-do') ||
          lowerContent.includes('list')
        ) {
          extractAndAddTask(userMessage.content)
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${errorMessage}. Please try again.` }])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

return (
  <div className="h-full flex flex-col p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-r border-gray-700/30">
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-3xl font-orbitron font-bold glow-text bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        AI ASSISTANT
      </h2>
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 animate-pulse-glow"></div>
    </div>

    {/* Messages */}
    <div className="flex-grow overflow-auto mb-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-20">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="font-orbitron">Ready to assist with your tasks</p>
        </div>
      )}

      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`flex items-start space-x-3 max-w-xs ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-gradient-to-r from-purple-500 to-purple-600"
              }`}
            >
              {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`p-3 rounded-2xl cyber-border backdrop-blur-sm ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-900/30 to-blue-800/30"
                  : "bg-gradient-to-r from-purple-900/30 to-purple-800/30"
              }`}
            >
              <p className="text-sm font-inter">{message.content}</p>
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-start space-x-3 max-w-xs">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl cyber-border backdrop-blur-sm bg-gradient-to-r from-purple-900/30 to-purple-800/30">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Input */}
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <div className="flex-grow relative">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your tasks..."
          className="w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-3 font-inter cyber-border hover-glow focus:glow-effect transition-all duration-300"
        />
      </div>
      <Button
        type="submit"
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl px-6 py-3 hover-glow transition-all duration-300 font-orbitron"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  </div>
)
}