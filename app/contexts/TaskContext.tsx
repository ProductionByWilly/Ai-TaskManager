"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  dueAt?: Date
  subtasks?: Task[]
}

interface TaskContextType {
  tasks: Task[]
  addTask: (text: string, dueAt?: Date) => void
  toggleTask: (id: number) => void
  deleteTask: (id: number) => void
  addSubtask: (parentId: number, subtaskText: string, dueAt?: Date) => void
  updateTaskDueAt: (id: number, dueAt?: Date) => void
  updateTaskText: (id: number, text: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export type { Task };
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (text: string, dueAt?: Date) => {
    if (text.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), text: text.trim(), completed: false, createdAt: new Date(), dueAt }
      ])
    }
  }

  const toggleTask = (id: number) => {
    const toggleRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
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
          return { ...task, dueAt }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  const updateTaskText = (id: number, text: string) => {
    const updateRecursive = (taskList: Task[]): Task[] =>
      taskList.map((task) => {
        if (task.id === id) {
          return { ...task, text }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateRecursive(task.subtasks) }
        }
        return task
      })
    setTasks((prev) => updateRecursive(prev))
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, addSubtask, updateTaskDueAt, updateTaskText }}>
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