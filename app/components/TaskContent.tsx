"use client"
import type { Task } from "../contexts/TaskContext"

interface TaskContentProps {
  task: Task
  level?: number
  renderActions?: (task: Task) => React.ReactNode
}

export default function TaskContent({ task, level = 0, renderActions }: TaskContentProps) {
  return (
    <div className={level > 0 ? "ml-6 border-l border-purple-500/20 pl-4" : ""}>
      <div className="flex items-center space-x-2 p-2">
        <span className={`font-inter ${task.completed ? "line-through text-purple-400/60" : "text-purple-100"}`}>{task.text}</span>
        <span className="text-xs text-purple-300/50 ml-2">{task.createdAt.toLocaleTimeString()}</span>
        {renderActions && renderActions(task)}
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {task.subtasks.map((subtask) => (
            <TaskContent key={subtask.id} task={subtask} level={level + 1} renderActions={renderActions} />
          ))}
        </div>
      )}
    </div>
  )
} 