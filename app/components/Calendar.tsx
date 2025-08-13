"use client"

import type React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Trash2, Stars } from "lucide-react"

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

interface CalendarProps {
  tasks: Task[]
  onClose: () => void
  onToggleTask?: (id: number) => void
  onDeleteTask?: (id: number) => void
}

const Calendar: React.FC<CalendarProps> = ({ tasks = [], onClose, onToggleTask, onDeleteTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }

  // Group tasks by date - with safety check
  const tasksByDate = Array.isArray(tasks)
    ? tasks.reduce(
        (acc, task) => {
          const dateKey = task.createdAt.toDateString()
          if (!acc[dateKey]) {
            acc[dateKey] = []
          }
          acc[dateKey].push(task)
          return acc
        },
        {} as Record<string, Task[]>,
      )
    : {}

  const getTasksForDate = (date: Date) => {
    return tasksByDate[date.toDateString()] || []
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ]

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Sort tasks by creation date (newest first) - with safety check
  const sortedTasks = Array.isArray(tasks)
    ? [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : []

  const completedCount = Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0
  const totalCount = Array.isArray(tasks) ? tasks.length : 0

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="nebula-bg rounded-2xl p-6 w-full max-w-6xl mx-4 space-border cosmic-glow relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Stars className="w-8 h-8 text-purple-400 animate-float" />
            <h2 className="text-2xl font-poppins font-semibold dream-text bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
              Calendar View
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300/70 hover:text-purple-100 transition-colors duration-200 text-2xl font-bold hover-float"
          >
            ×
          </button>
        </div>

        <div className="flex gap-6">
          {/* Calendar - Much more space now */}
          <div className="flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-3 rounded-lg bg-slate-900/50 hover:bg-purple-900/50 transition-colors duration-200 hover-float space-border"
              >
                <ChevronLeft className="w-6 h-6 text-purple-300" />
              </button>

              <h3 className="text-xl font-poppins font-semibold text-purple-100 dream-text">
                {monthNames[currentMonth]} {currentYear}
              </h3>

              <button
                onClick={() => navigateMonth("next")}
                className="p-3 rounded-lg bg-slate-900/50 hover:bg-purple-900/50 transition-colors duration-200 hover-float space-border"
              >
                <ChevronRight className="w-6 h-6 text-purple-300" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-poppins font-medium text-purple-300/70 py-3">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Much larger cells */}
            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-20"></div>
                }

                const dayTasks = getTasksForDate(date)
                const hasCompletedTasks = dayTasks.some((task) => task.completed)
                const hasPendingTasks = dayTasks.some((task) => !task.completed)

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      h-20 rounded-lg transition-all duration-200 relative font-inter text-base hover-float
                      ${
                        isToday(date)
                          ? "bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-purple-100 border border-purple-400/50 cosmic-glow"
                          : "bg-slate-900/30 text-purple-200/70 hover:bg-purple-900/30 space-border"
                      }
                      ${isSelected(date) ? "ring-2 ring-purple-400 cosmic-glow" : ""}
                      ${dayTasks.length > 0 ? "hover-float" : ""}
                    `}
                  >
                    <span className="relative z-10 font-semibold text-lg">{date.getDate()}</span>

                    {/* Task indicators */}
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {hasCompletedTasks && (
                          <div className="w-2.5 h-2.5 bg-violet-400 rounded-full cosmic-glow"></div>
                        )}
                        {hasPendingTasks && <div className="w-2.5 h-2.5 bg-purple-400 rounded-full cosmic-glow"></div>}
                      </div>
                    )}

                    {/* Task count */}
                    {dayTasks.length > 0 && (
                      <div className="absolute top-2 right-2 text-xs bg-purple-700/80 text-purple-100 rounded-full w-6 h-6 flex items-center justify-center cosmic-glow">
                        {dayTasks.length}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Task List Panel - Much smaller now */}
          <div className="w-64 bg-slate-900/50 rounded-xl p-3 space-border flex flex-col">
            {/* Header */}
            <div className="mb-3">
              <h4 className="font-poppins font-semibold text-sm text-purple-100 mb-2">Tasks</h4>
              <div className="grid grid-cols-3 gap-1 text-xs font-poppins font-medium">
                <div className="text-center">
                  <span className="text-purple-300/70 block">TOTAL</span>
                  <span className="text-purple-100 font-bold">{totalCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-violet-400 block">DONE</span>
                  <span className="text-violet-400 font-bold">{completedCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-purple-400 block">LEFT</span>
                  <span className="text-purple-400 font-bold">{totalCount - completedCount}</span>
                </div>
              </div>
              <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 mt-2 animate-cosmic-pulse"></div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-500/30">
              {sortedTasks.length === 0 ? (
                <div className="text-center text-purple-300/70 mt-6">
                  <Circle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-float" />
                  <p className="text-xs font-poppins font-medium">No tasks</p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group p-2 rounded-lg space-border backdrop-blur-sm transition-all duration-300 hover-float ${
                      task.completed
                        ? "bg-gradient-to-r from-violet-900/20 to-purple-800/20"
                        : "bg-gradient-to-r from-slate-900/30 to-purple-900/30"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <button
                        onClick={() => onToggleTask?.(task.id)}
                        className="flex-shrink-0 transition-all duration-300 hover:scale-110 mt-0.5"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-violet-400" />
                        ) : (
                          <Circle className="w-3 h-3 text-purple-300/70 hover:text-violet-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-inter leading-tight ${
                            task.completed ? "line-through text-purple-400/60" : "text-purple-100"
                          }`}
                        >
                          {task.text}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-purple-300/50 font-inter">
                            {task.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-purple-300/50 font-inter">
                            {task.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteTask?.(task.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 text-red-400 hover:text-red-300 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar
