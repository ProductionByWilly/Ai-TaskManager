"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Stars } from "lucide-react"
import { useTasks } from "../contexts/TaskContext"
import { useRef } from "react"

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

// System message to instruct the AI about task management
const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a cosmic AI assistant that helps manage tasks. Your ONLY valid responses for task actions are:

  - To add a task, respond ONLY with:
    { "action": "add", "task": "<task text>", "category": "work|personal|errand", "priority": "low|medium|high", "dueDate": "<natural language>", "recurring": "<rule>" }

  - To break down a task, respond ONLY with:
    { "action": "subtasks", "parent": "<main task>", "subtasks": ["<step 1>", "<step 2>", ...] }

  - To edit a task, respond ONLY with:
    { "action": "edit", "from": "<original text>", "to": "<new text>", "category": "work|personal|errand", "priority": "low|medium|high", "dueDate": "<natural language>", "recurring": "<rule>" }

  - To delete a task, respond ONLY with:
    { "action": "delete", "task": "<task text>" }

  Do NOT include any extra text, code block formatting, or explanations. Only output the JSON object for these actions.

  If the user is just chatting, reply in a dreamy, space-themed voice, but for any task action, use ONLY the JSON format above.`
}

// naive NL date parser placeholder (can be replaced with chrono-node)
function parseNaturalDate(input?: string): Date | undefined {
  if (!input || typeof input !== "string") return undefined
  const s = input.trim().toLowerCase()
  const now = new Date()
  if (s === "tomorrow") {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9,0,0,0); return d
  }
  if (/next\s+monday/.test(s)) {
    const d = new Date(now)
    const day = d.getDay()
    const diff = (1 + 7 - day) % 7 || 7
    d.setDate(d.getDate() + diff)
    d.setHours(9,0,0,0)
    return d
  }
  // yyyy-mm-dd or mm/dd or mm/dd/yyyy
  const iso = Date.parse(s)
  if (!Number.isNaN(iso)) return new Date(iso)
  // time only e.g., 3pm or 10:30am
  const timeMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10)
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const period = timeMatch[3]
    const d = new Date(now)
    let hour = h % 12
    if (period === "pm") hour += 12
    d.setHours(hour, m, 0, 0)
    return d
  }
  return undefined
}

export default function AiChat() {
  const { addTask, deleteTask, addSubtask, tasks, updateTaskText, updateTaskDueAt, updateTaskPriority } = useTasks()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAddedTaskId = useRef<number | null>(null)

  const extractSimpleTask = (content: string) => {
    return content
      .toLowerCase()
      .replace(/^(can you |please |could you |would you )/i, "")
      .replace(
        /^(add|create|make|put|set|remind me|add to|put on|set up|create a|add a|make a) (task|reminder|to-do|todo|to do|in my list|to my list|on my list)?/i,
        ""
      )
      .replace(/[?.!]/g, "")
      .trim()
  }

  // Fuzzy match helpers
  function normalize(s: string) {
    return s.toLowerCase().trim()
  }
  function tokenSet(str: string) {
    return new Set(normalize(str).split(/\s+/).filter(Boolean))
  }
  function overlapScore(a: string, b: string) {
    const A = tokenSet(a), B = tokenSet(b)
    if (!A.size || !B.size) return 0
    let overlap = 0
    A.forEach(t => { if (B.has(t)) overlap++ })
    return overlap / Math.max(A.size, B.size)
  }
  function findBestTaskId(query: string): number | null {
    const q = normalize(query)
    let best: { id: number, score: number } | null = null
    for (const t of tasks) {
      const s1 = normalize(t.text)
      let score = 0
      if (s1 === q) score = 1
      else if (s1.includes(q) || q.includes(s1)) score = 0.9
      else score = overlapScore(t.text, query)
      if (!best || score > best.score) best = { id: t.id, score }
    }
    return best && best.score >= 0.5 ? best.id : null
  }
  function editTaskAI(fromText: string, toText: string) {
    const id = findBestTaskId(fromText)
    if (id == null) return { ok: false, msg: `🚫 I couldn't find a task like "${fromText}".` }
    updateTaskText(id, toText.trim())
    return { ok: true, msg: `✨ The stars have realigned: "${fromText}" → "${toText}".` }
  }
  function deleteTaskAI(taskText: string) {
    const id = findBestTaskId(taskText)
    if (id == null) return { ok: false, msg: `🚫 I couldn't find "${taskText}" to remove.` }
    deleteTask(id)
    return { ok: true, msg: `🗑️ "${taskText}" has drifted into the cosmic void.` }
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
        const task = extractSimpleTask(userMessage.content)
        let response = 'I sense your cosmic message: "' + userMessage.content + '". '
  
        if (task) {
          addTask(task)
          response = `✨ I've added "${task}" to your task constellation! 🌠 Let me know what else shines in your mind.`
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
        let content = aiMessage.content.trim()

        // Try to extract the first JSON object from the response
        if (content.startsWith("```")) {
          content = content.replace(/```json|```/g, "").trim()
        }
        // Regex fallback: extract first {...} JSON object
        if (!content.startsWith("{")) {
          const match = content.match(/\{[\s\S]*\}/)
          if (match) {
            content = match[0]
          }
        }

        // Try to parse the AI response as JSON for actions
        try {
          const parsed = JSON.parse(content)
          // normalize schema fields
          const action = parsed.action
          const taskText = parsed.taskText || parsed.task || parsed.to || parsed.text
          const originalText = parsed.originalText || parsed.from
          const newText = parsed.newText || parsed.to
          const category = parsed.category && ["work","personal","errand"].includes(parsed.category) ? parsed.category : undefined
          const priority = parsed.priority && ["low","medium","high"].includes(parsed.priority) ? parsed.priority : undefined
          const recurring = typeof parsed.recurring === "string" ? parsed.recurring : undefined
          const dueAt = parseNaturalDate(parsed.dueDate || parsed.due_at || parsed.due)

          if (action === "add" && taskText) {
            let existingTask = tasks.find((t) => t.text.toLowerCase() === String(taskText).toLowerCase())
            let newId: number
            if (!existingTask) {
              newId = Date.now() + Math.floor(Math.random() * 1000)
              addTask(String(taskText), dueAt, category, priority, recurring)
              lastAddedTaskId.current = newId
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `✨ Added "${taskText}"${category ? ` (${category})` : ""}${priority ? ` [${priority}]` : ""}${dueAt ? ` due ${dueAt.toLocaleString()}` : ""}.` },
              ])
            } else {
              lastAddedTaskId.current = existingTask.id
              setMessages((prev) => [...prev, { role: "assistant", content: `"${taskText}" already exists.` }])
            }
          } else if (action === "edit" && (originalText || parsed.from) && (newText || parsed.to)) {
            const res = editTaskAI(String(originalText), String(newText))
            if (res.ok) {
              const id = findBestTaskId(String(newText))
              if (id != null) {
                updateTaskText(id, String(newText), category)
                if (dueAt) updateTaskDueAt(id, dueAt)
                if (priority) updateTaskPriority(id, priority)
                if (recurring) updateTaskRecurring(id, recurring)
              }
            }
            setMessages((prev) => [...prev, { role: "assistant", content: res.msg }])
          } else if (parsed.action === "subtasks" && parsed.parent && Array.isArray(parsed.subtasks)) {
            // Only add subtasks to the parent, do not add the parent again
            let parentTask = tasks.find((t) => t.text.toLowerCase() === parsed.parent.toLowerCase())
            if (!parentTask && lastAddedTaskId.current) {
              parentTask = tasks.find((t) => t.id === lastAddedTaskId.current)
            }
            if (parentTask) {
              parsed.subtasks.forEach((sub: string) => { addSubtask(parentTask.id, sub) })
              setMessages((prev) => [...prev, { role: "assistant", content: `🪐 Added subtasks under "${parsed.parent}".` }])
            } else {
              setMessages((prev) => [...prev, { role: "assistant", content: `🚫 Couldn't find "${parsed.parent}".` }])
            }
          } else if (parsed.action === "delete" && (parsed.task || parsed.taskText)) {
            const res = deleteTaskAI(parsed.task || parsed.taskText)
            setMessages((prev) => [...prev, { role: "assistant", content: res.msg }])
          } else {
            setMessages((prev) => [...prev, aiMessage])
          }
        } catch {
          // Not JSON? Try to extract a task from conversational text as a fallback
          const addMatch = content.match(/add(?:\s+task)?\s+["']?([\w\s]+)["']?/i)
          if (addMatch && addMatch[1]) {
            // basic naive category inference
            const text = addMatch[1].trim()
            const lc = text.toLowerCase()
            let category: "work" | "personal" | "errand" | undefined
            if (/(meet|email|report|project|office|work)/.test(lc)) category = "work"
            else if (/(buy|pick up|store|errand|mail|grocer|laundry)/.test(lc)) category = "errand"
            else category = "personal"
            addTask(text, undefined, category)
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `✨ I've added "${text}"${category ? ` in the ${category} constellation` : ""}. 🌌`,
              },
            ])
          } else {
            setMessages((prev) => [...prev, aiMessage])
          }
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
