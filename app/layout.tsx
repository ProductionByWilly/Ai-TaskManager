import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import type React from "react"
import { TaskProvider } from "./contexts/TaskContext"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A professional task manager with AI assistance",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} bg-black text-white font-inter`}>
        <TaskProvider>{children}</TaskProvider>
      </body>
    </html>
  )
}
