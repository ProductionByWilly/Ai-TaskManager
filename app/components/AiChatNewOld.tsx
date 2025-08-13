"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Stars } from "lucide-react"
import { useTasks } from "../contexts/TaskContext"

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

// System message to instruct the AI about task management
const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a cosmic AI assistant that helps manage tasks in the vast expanse of space. Your primary functions are:
  1. Add tasks when users request them
  2. Respond conversationally with a dreamy, space-themed tone
  3. Help users navigate their cosmic journey of productivity

  When users mention anything about tasks, to-dos, or reminders:
  1. Extract the task details from their message
  2. Respond confirming what you've added with space-themed language
  3. Be mystical and helpful, like a guide through the stars

  Examples:
  User: "Hello can you add a task to my list"
  Response: "Greetings, cosmic traveler! I'd be delighted to add a task to your stellar collection. What mission shall we chart among the stars?"

  User: "Add getting coffee"
  Response: "I've added 'getting coffee' to your cosmic task constellation! ✨ May this fuel power your journey through the void. What other stellar missions await?"

  User: "Remind me to call mom tomorrow"
  Response: "I've inscribed 'call mom tomorrow' into your celestial task registry. 🌟 A beautiful connection across the cosmic distances. Shall we add more stardust to your mission log?"

  Always maintain a dreamy, space-themed tone while being helpful and extracting tasks from user messages.`,
}

export default function AiChat() {
  const { addTask } = useTasks()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractAndAddTask = (content: string) => {
    // Remove common task-related phrases
    const cleanContent = content
      .toLowerCase()
      .replace(/^(can you |please |could you |would you )/i, "")
      .replace(
        /^(add|create|make|put|set|remind me|add to|put on|set up|create a|add a|make a) (task|reminder|to-do|todo|to do|in my list|to my list|on my list)?/i,
        "",
      )
      .replace(/[?.!]/g, "")
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
    setMessages((prev) => [...prev, userMessage])

    try {
      // If no API key is provided, use fallback behavior
      if (!DEEPSEEK_API_KEY) {
        // Fallback: Simple task extraction and echo response
        const lowerContent = userMessage.content.toLowerCase()
        let response = 'I sense your cosmic message: "' + userMessage.content + '". '

        if (
          lowerContent.includes("task") ||
          lowerContent.includes("remind") ||
          lowerContent.includes("todo") ||
          lowerContent.includes("to-do") ||
          lowerContent.includes("list") ||
          lowerContent.includes("add") ||
          lowerContent.includes("create")
        ) {
          const taskAdded = extractAndAddTask(userMessage.content)
          if (taskAdded) {
            response =
              "✨ Your task has been inscribed in the cosmic registry! The stars align to guide your productivity journey. What other stellar missions shall we chart?"
          } else {
            response =
              "🌟 I'm here to help you navigate the cosmic task realm! Tell me what mission you'd like to add to your stellar collection."
          }
        } else {
          response += "How may I assist you in your journey through the productivity cosmos? ✨"
        }

        setTimeout(() => {
          setMessages((prev) => [...prev, { role: "assistant", content: response }])
          setIsLoading(false)
        }, 1500)

        setInput("")
        return
      }

      // Real API call
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [SYSTEM_MESSAGE, ...messages, userMessage],
          max_tokens: 2048,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.choices?.[0]?.message) {
        const aiMessage = data.choices[0].message
        setMessages((prev) => [...prev, aiMessage])

        // Try to extract and add task from user message
        const lowerContent = userMessage.content.toLowerCase()
        if (
          lowerContent.includes("task") ||
          lowerContent.includes("remind") ||
          lowerContent.includes("todo") ||
          lowerContent.includes("to-do") ||
          lowerContent.includes("list")
        ) {
          extractAndAddTask(userMessage.content)
        }
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🌌 Cosmic interference detected: ${errorMessage}. The stars will realign shortly...`,
        },
      ])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  return (
    <div className="h-full flex flex-col p-6 nebula-bg border-r border-purple-500/20 relative z-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Stars className="w-8 h-8 text-purple-400 animate-float" />
          <h2 className="text-2xl font-poppins font-semibold dream-text bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
            AI Assistant
          </h2>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500 animate-cosmic-pulse"></div>
        {!DEEPSEEK_API_KEY && (
          <p className="text-xs text-purple-300/70 mt-2 font-inter">
            ✨ Demo mode - Add NEXT_PUBLIC_DEEPSEEK_API_KEY for full functionality
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-auto mb-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/30">
        {messages.length === 0 && (
          <div className="text-center text-purple-300/70 mt-20">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50 animate-float" />
            <p className="font-poppins font-medium">Ready to assist with your tasks</p>
            <p className="text-sm mt-2 font-inter">Try saying "Add a task" or "Remind me to..."</p>
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
                    ? "bg-gradient-to-r from-violet-500 to-purple-600"
                    : "bg-gradient-to-r from-purple-500 to-violet-600"
                } cosmic-glow`}
              >
                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-3 rounded-2xl space-border backdrop-blur-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-900/30 to-purple-800/30"
                    : "bg-gradient-to-r from-purple-900/30 to-violet-800/30"
                }`}
              >
                <p className="text-sm font-inter text-purple-100">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-xs">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-violet-600 cosmic-glow">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl space-border backdrop-blur-sm bg-gradient-to-r from-purple-900/30 to-violet-800/30">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
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
            placeholder="Share your cosmic thoughts..."
            className="w-full bg-slate-900/50 border-purple-500/30 text-purple-100 placeholder-purple-300/50 rounded-xl px-4 py-3 font-inter space-border hover-float focus:cosmic-glow transition-all duration-300"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl px-6 py-3 hover-float transition-all duration-300 font-poppins font-medium disabled:opacity-50 cosmic-glow"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
