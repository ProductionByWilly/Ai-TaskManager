"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2, Circle, Trash2, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import { useTasks } from "../contexts/TaskContext"
import Calendar from "./Calendar"

// Use the Task interface from context, not a local one
// Remove parentId and isExpanded from the interface
interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  subtasks?: Task[]
}

interface TaskItemProps {
  task: Task
  level?: number
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSubtask: (parentId: number, subtaskText: string) => void
  expandedIds: Set<number>
  onToggleExpanded: (id: number) => void
}

const TaskItem: React.FC<TaskItemProps> = ({ task, level = 0, onToggle, onDelete, onAddSubtask, expandedIds, onToggleExpanded }) => {
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const [subtaskText, setSubtaskText] = useState("")

  const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0
  const completedSubtasks = hasSubtasks ? task.subtasks!.filter((st) => st.completed).length : 0
  const totalSubtasks = hasSubtasks ? task.subtasks!.length : 0
  const isExpanded = expandedIds.has(task.id)

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (subtaskText.trim()) {
      onAddSubtask(task.id, subtaskText)
      setSubtaskText("")
      setShowSubtaskInput(false)
    }
  }

  return (
    <div className={`${level > 0 ? "ml-6 border-l border-purple-500/20 pl-4" : ""}`}>
      <div
        className={`group p-4 rounded-xl space-border backdrop-blur-sm transition-all duration-300 hover-float ${
          task.completed
            ? "bg-gradient-to-r from-violet-900/20 to-purple-800/20"
            : "bg-gradient-to-r from-slate-900/30 to-purple-900/30"
        }`}
      >
        <div className="flex items-center space-x-3">
          {/* Expand/Collapse Button */}
          {hasSubtasks && (
            <button
              onClick={() => onToggleExpanded(task.id)}
              className="flex-shrink-0 transition-all duration-300 hover:scale-110 text-purple-300/70 hover:text-violet-400"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {/* Complete Button */}
          <button
            onClick={() => onToggle(task.id)}
            className="flex-shrink-0 transition-all duration-300 hover:scale-110"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-violet-400 cosmic-glow" />
            ) : (
              <Circle className="w-6 h-6 text-purple-300/70 hover:text-violet-400" />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-grow">
            <div className="flex items-center space-x-2">
              <p
                className={`font-inter transition-all duration-300 ${
                  task.completed ? "line-through text-purple-400/60" : "text-purple-100"
                }`}
              >
                {task.text}
              </p>
              {hasSubtasks && (
                <span className="text-xs bg-purple-700/50 text-purple-200 px-2 py-1 rounded-full font-poppins font-medium">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
            <p className="text-xs text-purple-300/50 mt-1 font-inter">{task.createdAt.toLocaleTimeString()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Add Subtask Button */}
            <button
              onClick={() => setShowSubtaskInput(true)}
              className="flex-shrink-0 transition-all duration-300 hover:scale-110 text-purple-400 hover:text-violet-400"
              title="Add subtask"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(task.id)}
              className="flex-shrink-0 transition-all duration-300 hover:scale-110 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Subtask Input */}
        {showSubtaskInput && (
          <form onSubmit={handleAddSubtask} className="mt-3 ml-10">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={subtaskText}
                onChange={(e) => setSubtaskText(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-grow bg-slate-800/50 border-purple-500/30 text-purple-100 placeholder-purple-300/50 rounded-lg px-3 py-2 text-sm font-inter"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg px-3 py-2 text-sm font-poppins font-medium"
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowSubtaskInput(false)
                  setSubtaskText("")
                }}
                className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30 rounded-lg px-3 py-2 text-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Render Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-2">
          {(task.subtasks ?? []).map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TaskList() {
  const { tasks, addTask, toggleTask, deleteTask, addSubtask } = useTasks()
  const [newTask, setNewTask] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      addTask(newTask)
      setNewTask("")
    }
  }

  // Ensure tasks is always an array and flatten for counting
  const safeTasks = Array.isArray(tasks) ? tasks : []

  const flattenTasks = (taskList: Task[]): Task[] => {
    let flattened: Task[] = []
    taskList.forEach((task) => {
      flattened.push(task)
      if (task.subtasks && task.subtasks.length > 0) {
        flattened = flattened.concat(flattenTasks(task.subtasks))
      }
    })
    return flattened
  }

  const allTasks = flattenTasks(safeTasks)
  const completedCount = allTasks.filter((task) => task.completed).length
  const totalCount = allTasks.length

  const handleAddSubtask = (parentId: number, subtaskText: string) => {
    addSubtask(parentId, subtaskText)
  }

  const handleToggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="h-full flex flex-col p-6 nebula-bg border-l border-purple-500/20 relative z-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-violet-400 animate-float" />
            <h2 className="text-2xl font-poppins font-semibold dream-text bg-gradient-to-r from-violet-400 via-purple-400 to-violet-300 bg-clip-text text-transparent">
              Task Manager
            </h2>
          </div>
          <Button
            onClick={() => setShowCalendar(true)}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl px-4 py-2 hover-float transition-all duration-300 font-poppins font-medium cosmic-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Calendar
          </Button>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 mt-2 animate-cosmic-pulse"></div>

        {/* Stats */}
        <div className="flex justify-between mt-4 text-sm font-poppins font-medium">
          <span className="text-purple-300/70">Total: {totalCount}</span>
          <span className="text-violet-400">Completed: {completedCount}</span>
          <span className="text-purple-400">Remaining: {totalCount - completedCount}</span>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-grow relative">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Chart a new stellar mission..."
              className="w-full bg-slate-900/50 border-purple-500/30 text-purple-100 placeholder-purple-300/50 rounded-xl px-4 py-3 font-inter space-border hover-float focus:cosmic-glow transition-all duration-300"
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl px-6 py-3 hover-float transition-all duration-300 font-poppins font-medium cosmic-glow"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Task List */}
      <div className="flex-grow overflow-auto space-y-3 scrollbar-thin scrollbar-thumb-purple-500/30">
        {safeTasks.length === 0 && (
          <div className="text-center text-purple-300/70 mt-20">
            <Circle className="w-16 h-16 mx-auto mb-4 opacity-50 animate-float" />
            <p className="font-poppins font-medium">No tasks yet</p>
            <p className="text-sm mt-2 font-inter">Add your first task to get started</p>
          </div>
        )}

        {safeTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAddSubtask={handleAddSubtask}
            expandedIds={expandedIds}
            onToggleExpanded={handleToggleExpanded}
          />
        ))}
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <Calendar
          tasks={allTasks}
          onClose={() => setShowCalendar(false)}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
        />
      )}
    </div>
  )
}
