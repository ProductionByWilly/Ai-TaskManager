"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTasks } from "../contexts/TaskContext"
import type { Task } from "../contexts/TaskContext"

export default function TaskManagerBasic() {
  const { tasks, addTask, toggleTask, deleteTask, updateTaskText } = useTasks()
  const [input, setInput] = useState("")
  const [editId, setEditId] = useState<number | null>(null)

  const handleAdd = () => {
    if (!input.trim()) return
    addTask(input.trim())
    setInput("")
  }

  const handleSave = (id: number) => {
    if (!input.trim()) return
    updateTaskText(id, input.trim())
    setEditId(null)
    setInput("")
  }

  const beginEdit = (task: Task) => {
    setEditId(task.id)
    setInput(task.text)
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Task Manager (Basic)</h2>

      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a task"
        />
        {editId ? (
          <Button onClick={() => handleSave(editId)}>Save</Button>
        ) : (
          <Button onClick={handleAdd}>Add</Button>
        )}
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-3 p-2 rounded border border-slate-800">
            <label className="flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              <span className={task.completed ? "line-through text-slate-400" : ""}>{task.text}</span>
            </label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => beginEdit(task)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteTask(task.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
