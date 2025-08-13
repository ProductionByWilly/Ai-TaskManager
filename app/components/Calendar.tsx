"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Trash2, Stars } from "lucide-react"
import { useTasks } from "../contexts/TaskContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  dueAt?: Date
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
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const { updateTaskText, updateTaskDueAt } = useTasks()

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays: (Date | null)[] = []

  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }

  // Group tasks by date (prefer dueAt date if set)
  const tasksByDate = useMemo(() => (
    Array.isArray(tasks)
      ? tasks.reduce(
          (acc, task) => {
            const keyDate = (task.dueAt ?? task.createdAt)
            const dateKey = keyDate.toDateString()
            if (!acc[dateKey]) {
              acc[dateKey] = []
            }
            acc[dateKey].push(task)
            return acc
          },
          {} as Record<string, Task[]>,
        )
      : {}
  ), [tasks])

  const getTasksForDate = (date: Date) => {
    return tasksByDate[date.toDateString()] || []
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") newDate.setMonth(prev.getMonth() - 1)
      else newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const isToday = (date: Date) => date.toDateString() === today.toDateString()
  const isSelected = (date: Date) => selectedDate && date.toDateString() === selectedDate.toDateString()

  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Sort tasks by dueAt (if set) else by createdAt (newest first)
  const sortedTasks = useMemo(() => (
    Array.isArray(tasks)
      ? [...tasks].sort((a, b) => {
          const aDate = (a.dueAt ?? a.createdAt).getTime()
          const bDate = (b.dueAt ?? b.createdAt).getTime()
          return bDate - aDate
        })
      : []
  ), [tasks])

  const completedCount = Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0
  const totalCount = Array.isArray(tasks) ? tasks.length : 0

  const editingTask = useMemo(() => sortedTasks.find(t => t.id === editingTaskId) || null, [sortedTasks, editingTaskId])
  const [editText, setEditText] = useState<string>("")
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [editTime, setEditTime] = useState<string>("")
  const [editPeriod, setEditPeriod] = useState<string>("AM")

  const openEditor = (task: Task) => {
    setEditingTaskId(task.id)
    setEditText(task.text)
    const base = task.dueAt ?? task.createdAt
    setEditDate(base)
    setEditTime(format(base, "hh:mm"))
    setEditPeriod(base.getHours() >= 12 ? "PM" : "AM")
  }

  const to24Hour = (timeStr: string, period: string): { h: number; m: number } | null => {
    const [hStr, mStr] = timeStr.split(":")
    let h = parseInt(hStr ?? "", 10)
    const m = parseInt(mStr ?? "", 10)
    if (isNaN(h) || isNaN(m)) return null
    if (period === "AM") { if (h === 12) h = 0 } else { if (h < 12) h += 12 }
    return { h, m }
  }

  const saveEdit = () => {
    if (!editingTask) return
    if (editText.trim()) updateTaskText(editingTask.id, editText.trim())
    let dueAt = editDate ? new Date(editDate) : undefined
    if (dueAt && editTime) {
      const conv = to24Hour(editTime, editPeriod)
      if (conv) dueAt.setHours(conv.h, conv.m, 0, 0)
    }
    updateTaskDueAt(editingTask.id, dueAt)
    setEditingTaskId(null)
  }

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
          <button onClick={onClose} className="text-purple-300/70 hover:text-purple-100 transition-colors duration-200 text-2xl font-bold hover-float">×</button>
        </div>

        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => navigateMonth("prev")} className="p-3 rounded-lg bg-slate-900/50 hover:bg-purple-900/50 transition-colors duration-200 hover-float space-border">
                <ChevronLeft className="w-6 h-6 text-purple-300" />
              </button>
              <h3 className="text-xl font-poppins font-semibold text-purple-100 dream-text">{monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={() => navigateMonth("next")} className="p-3 rounded-lg bg-slate-900/50 hover:bg-purple-900/50 transition-colors duration-200 hover-float space-border">
                <ChevronRight className="w-6 h-6 text-purple-300" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-poppins font-medium text-purple-300/70 py-3">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((date, index) => {
                if (!date) return <div key={index} className="h-20"></div>
                const dayTasks = getTasksForDate(date)
                const hasCompletedTasks = dayTasks.some((task) => task.completed)
                const hasPendingTasks = dayTasks.some((task) => !task.completed)
                return (
                  <button key={index} onClick={() => setSelectedDate(date)} className={`h-20 rounded-lg transition-all duration-200 relative font-inter text-base hover-float ${isToday(date) ? "bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-purple-100 border border-purple-400/50 cosmic-glow" : "bg-slate-900/30 text-purple-200/70 hover:bg-purple-900/30 space-border"} ${isSelected(date) ? "ring-2 ring-purple-400 cosmic-glow" : ""} ${dayTasks.length > 0 ? "hover-float" : ""}`}>
                    <span className="relative z-10 font-semibold text-lg">{date.getDate()}</span>
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {hasCompletedTasks && (<div className="w-2.5 h-2.5 bg-violet-400 rounded-full cosmic-glow"></div>)}
                        {hasPendingTasks && <div className="w-2.5 h-2.5 bg-purple-400 rounded-full cosmic-glow"></div>}
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className="absolute top-2 right-2 text-xs bg-purple-700/80 text-purple-100 rounded-full w-6 h-6 flex items-center justify-center cosmic-glow">{dayTasks.length}</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Task List Panel */}
          <div className="w-80 bg-slate-900/50 rounded-xl p-3 space-border flex flex-col">
            <div className="mb-3">
              <h4 className="font-poppins font-semibold text-sm text-purple-100 mb-2">Tasks</h4>
              <div className="grid grid-cols-3 gap-1 text-xs font-poppins font-medium">
                <div className="text-center"><span className="text-purple-300/70 block">TOTAL</span><span className="text-purple-100 font-bold">{totalCount}</span></div>
                <div className="text-center"><span className="text-violet-400 block">DONE</span><span className="text-violet-400 font-bold">{completedCount}</span></div>
                <div className="text-center"><span className="text-purple-400 block">LEFT</span><span className="text-purple-400 font-bold">{totalCount - completedCount}</span></div>
              </div>
              <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 mt-2 animate-cosmic-pulse"></div>
            </div>
            <div className="flex-1 overflow-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-500/30">
              {sortedTasks.length === 0 ? (
                <div className="text-center text-purple-300/70 mt-6">
                  <Circle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-float" />
                  <p className="text-xs font-poppins font-medium">No tasks</p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <button key={task.id} onClick={() => openEditor(task)} className={`w-full text-left group p-2 rounded-lg space-border backdrop-blur-sm transition-all duration-300 hover-float ${task.completed ? "bg-gradient-to-r from-violet-900/20 to-purple-800/20" : "bg-gradient-to-r from-slate-900/30 to-purple-900/30"}`}>
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {task.completed ? (<CheckCircle2 className="w-3 h-3 text-violet-400" />) : (<Circle className="w-3 h-3 text-purple-300/70" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-inter leading-tight ${task.completed ? "line-through text-purple-400/60" : "text-purple-100"}`}>{task.text}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-purple-300/50 font-inter">{(task.dueAt ?? task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                          <p className="text-xs text-purple-300/50 font-inter">{(task.dueAt ?? task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id) }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 text-red-400 hover:text-red-300 mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Editor Panel */}
          {editingTask && (
            <div className="w-96 bg-slate-900/60 rounded-xl p-4 space-border flex flex-col gap-3">
              <h4 className="font-poppins font-semibold text-sm text-purple-100">Edit Task</h4>
              <Input value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div className="space-y-3">
                <ShadCalendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus />
                <div className="flex items-center gap-2">
                  <Input className="w-24" type="text" placeholder="hh:mm" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                  <Select value={editPeriod} onValueChange={(v) => setEditPeriod(v)}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTaskId(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calendar
