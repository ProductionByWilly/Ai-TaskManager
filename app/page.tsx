import AiChat from "./components/AiChat"
import TaskList from "./components/TaskList"
import ResizeableLayout from "./components/ResizeableLayout"

export default function Home() {
  return (
    <main className="h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-black to-purple-900/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      {/* Content */}
      <div className="relative z-10 h-full">
        <ResizeableLayout
          leftPanel={<AiChat />}
          rightPanel={<TaskList />}
          initialLeftWidth={35}
          minWidth={25}
          maxWidth={75}
        />
      </div>
    </main>
  )
}
