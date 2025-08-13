"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  subtasks?: Task[]
}

interface TaskContextType {
  tasks: Task[]
  addTask: (text: string) => void
  toggleTask: (id: number) => void
  deleteTask: (id: number) => void
  addSubtask: (parentId: number, subtaskText: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export type { Task };
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (text: string) => {
    if (text.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), text: text.trim(), completed: false, createdAt: new Date() }
      ])
    }
  }

  const toggleTask = (id: number) => {
    const toggleRecursive = (tasks: Task[]): Task[] =>
      tasks.map((task) => {
        if (task.id === id) {
          return { ...task, completed: !task.completed }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: toggleRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => toggleRecursive(prev))
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const addSubtask = (parentId: number, subtaskText: string) => {
    setTasks(tasks => tasks.map(task => {
      if (task.id === parentId) {
        const newSubtask: Task = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          text: subtaskText,
          completed: false,
          createdAt: new Date(),
        }
        return {
          ...task,
          subtasks: task.subtasks ? [...task.subtasks, newSubtask] : [newSubtask],
        }
      }
      return task
    }))
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, addSubtask }}>
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