"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2, Circle, Trash2, CalendarIcon } from "lucide-react"
import Calendar from "./Calendar"

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: newTask,
          completed: false,
          createdAt: new Date(),
        },
      ])
      setNewTask("")
    }
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const totalCount = tasks.length

  return (
    <div className="h-full flex flex-col p-6 bg-gradient-to-br from-gray-900 via-black to-gray-800 border-l border-gray-700/30">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-orbitron font-bold glow-text bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            TASK MATRIX
          </h2>
          <Button
            onClick={() => setShowCalendar(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl px-4 py-2 hover-glow transition-all duration-300 font-orbitron"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            CALENDAR
          </Button>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-green-500 to-blue-500 mt-2 animate-pulse-glow"></div>

        {/* Stats */}
        <div className="flex justify-between mt-4 text-sm font-orbitron">
          <span className="text-gray-400">TOTAL: {totalCount}</span>
          <span className="text-green-400">COMPLETED: {completedCount}</span>
          <span className="text-blue-400">REMAINING: {totalCount - completedCount}</span>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-grow relative">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Initialize new task..."
              className="w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-3 font-inter cyber-border hover-glow focus:glow-effect transition-all duration-300"
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl px-6 py-3 hover-glow transition-all duration-300 font-orbitron"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Task List */}
      <div className="flex-grow overflow-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-600">
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-orbitron">No tasks in the matrix</p>
            <p className="text-sm mt-2">Add your first task to get started</p>
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group p-4 rounded-xl cyber-border backdrop-blur-sm transition-all duration-300 hover-glow ${
              task.completed
                ? "bg-gradient-to-r from-green-900/20 to-green-800/20"
                : "bg-gradient-to-r from-gray-900/30 to-gray-800/30"
            }`}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleTask(task.id)}
                className="flex-shrink-0 transition-all duration-300 hover:scale-110"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 hover:text-blue-400" />
                )}
              </button>

              <div className="flex-grow">
                <p
                  className={`font-inter transition-all duration-300 ${
                    task.completed ? "line-through text-gray-500" : "text-white"
                  }`}
                >
                  {task.text}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-orbitron">{task.createdAt.toLocaleTimeString()}</p>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <Calendar
          tasks={tasks}
          onClose={() => setShowCalendar(false)}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
        />
      )}
    </div>
  )
}
