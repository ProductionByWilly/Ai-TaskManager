"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  dueAt?: Date
  dueDate?: Date
  category?: "work" | "personal" | "errand"
  priority?: "low" | "medium" | "high"
  recurring?: string
  subtasks?: Task[]
}

interface TaskContextType {
  tasks: Task[]
  addTask: (text: string, dueAt?: Date, category?: Task["category"], priority?: Task["priority"], recurring?: string) => void
  toggleTask: (id: number) => void
  deleteTask: (id: number) => void
  addSubtask: (parentId: number, subtaskText: string, dueAt?: Date) => void
  updateTaskDueAt: (id: number, dueAt?: Date) => void
  updateTaskText: (id: number, text: string, category?: Task["category"]) => void
  updateTaskPriority: (id: number, priority?: Task["priority"]) => void
  updateTaskRecurring: (id: number, recurring?: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export type { Task };
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (text: string, dueAt?: Date, category?: Task["category"], priority?: Task["priority"], recurring?: string) => {
    if (text.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), text: text.trim(), completed: false, createdAt: new Date(), dueAt, dueDate: dueAt, category, priority, recurring }
      ])
    }
  }

  function computeNextDue(current: Date, rule: string): Date {
    const d = new Date(current)
    const s = rule.toLowerCase()
    if (s.includes("daily")) {
      d.setDate(d.getDate() + 1)
      return d
    }
    if (s.includes("every 2 weeks") || s.includes("biweekly")) {
      d.setDate(d.getDate() + 14)
      return d
    }
    if (s.includes("weekly") || /^every\s+week/.test(s)) {
      d.setDate(d.getDate() + 7)
      return d
    }
    if (s.includes("monthly")) {
      d.setMonth(d.getMonth() + 1)
      return d
    }
    const weekdayMatch = s.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
    if (weekdayMatch) {
      const target = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(weekdayMatch[1])
      const cur = d.getDay()
      let diff = (target - cur + 7) % 7
      if (diff === 0) diff = 7
      d.setDate(d.getDate() + diff)
      return d
    }
    // default: one week later
    d.setDate(d.getDate() + 7)
    return d
  }

  const toggleTask = (id: number) => {
    const toggledCompleted: Task[] = []
    const toggleRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          const newCompleted = !task.completed
          if (newCompleted && task.recurring) {
            toggledCompleted.push(task)
          }
          return { ...task, completed: newCompleted }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: toggleRecursive(task.subtasks) }
        }
        return task
      })

    setTasks((prev) => {
      const updated = toggleRecursive(prev)
      if (toggledCompleted.length === 0) return updated
      const additions: Task[] = toggledCompleted.map((t) => {
        const base = t.dueAt ?? new Date()
        const next = computeNextDue(base, t.recurring as string)
        return {
          id: Date.now() + Math.floor(Math.random() * 1000),
          text: t.text,
          completed: false,
          createdAt: new Date(),
          dueAt: next,
          dueDate: next,
          category: t.category,
          priority: t.priority,
          recurring: t.recurring,
        }
      })
      return [...updated, ...additions]
    })
  }

  const deleteTask = (id: number) => {
    const deleteRecursive = (taskList: Task[]): Task[] =>
      taskList
        .filter((task) => task.id !== id)
        .map((task) => ({ ...task, subtasks: task.subtasks ? deleteRecursive(task.subtasks) : task.subtasks }))
    setTasks((prev) => deleteRecursive(prev))
  }

  const addSubtask = (parentId: number, subtaskText: string, dueAt?: Date) => {
    setTasks(tasks => tasks.map(task => {
      if (task.id === parentId) {
        const newSubtask: Task = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          text: subtaskText,
          completed: false,
          createdAt: new Date(),
          dueAt,
          dueDate: dueAt,
        }
        return {
          ...task,
          subtasks: task.subtasks ? [...task.subtasks, newSubtask] : [newSubtask],
        }
      }
      return task.subtasks && task.subtasks.length
        ? { ...task, subtasks: task.subtasks.map(st => st) }
        : task
    }))
  }

  const updateTaskDueAt = (id: number, dueAt?: Date) => {
    const updateRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          return { ...task, dueAt, dueDate: dueAt }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  const updateTaskText = (id: number, text: string, category?: Task["category"]) => {
    const updateRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          return { ...task, text, category: category ?? task.category }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  const updateTaskPriority = (id: number, priority?: Task["priority"]) => {
    const updateRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          return { ...task, priority }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  const updateTaskRecurring = (id: number, recurring?: string) => {
    const updateRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          return { ...task, recurring }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, addSubtask, updateTaskDueAt, updateTaskText, updateTaskPriority, updateTaskRecurring }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
} 