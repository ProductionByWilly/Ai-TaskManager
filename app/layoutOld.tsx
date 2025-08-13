import type { Metadata } from "next"
import { Orbitron, Inter } from "next/font/google"
import "./globals.css"
import type React from "react"
import { TaskProvider } from "./contexts/TaskContext"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple task manager with AI chat",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${inter.variable} bg-black text-white font-inter`}>
        <TaskProvider>
          {children}
        </TaskProvider>
      </body>
    </html>
  )
}
