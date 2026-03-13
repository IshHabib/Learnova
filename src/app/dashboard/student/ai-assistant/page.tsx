
"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Send, User, Sparkles, Wand2, BookText, Lightbulb } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI Learning Assistant. How can I help you with your studies today?" }
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    
    // Simulation: AI Response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "That's a great question about " + input + ". Based on your course materials, here's a concise explanation..." 
      }])
    }, 1000)
  }

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold font-headline">AI Tutor</h1>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-4 md:p-6 bg-background">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <Avatar className={`h-8 w-8 rounded-lg shrink-0 ${m.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.role === "assistant" ? <Sparkles className="h-4 w-4 m-auto" /> : <User className="h-4 w-4 m-auto" />}
                    </Avatar>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${m.role === "assistant" ? "bg-white shadow-sm border" : "bg-primary text-primary-foreground"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 max-w-3xl mx-auto w-full">
              <div className="flex gap-2 p-2 bg-white rounded-xl shadow-md border focus-within:ring-2 ring-primary/20 transition-all">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..." 
                  className="border-none shadow-none focus-visible:ring-0" 
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex w-80 border-l bg-card p-6 flex-col gap-8">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Wand2 className="h-4 w-4 text-primary" />
                Quick Tools
              </h3>
              <div className="grid gap-2">
                <Button variant="outline" size="sm" className="justify-start h-auto p-3 flex-col items-start">
                  <span className="text-xs font-bold mb-1">Summarize Notes</span>
                  <p className="text-[10px] text-muted-foreground text-left">Upload a PDF or image to get a concise summary.</p>
                </Button>
                <Button variant="outline" size="sm" className="justify-start h-auto p-3 flex-col items-start">
                  <span className="text-xs font-bold mb-1">Generate Practice Quiz</span>
                  <p className="text-[10px] text-muted-foreground text-left">Create a 5-question quiz on the current topic.</p>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <BookText className="h-4 w-4 text-primary" />
                Recent Topics
              </h3>
              <div className="space-y-2">
                {["Photosynthesis", "Classical Mechanics", "Microeconomics"].map((topic, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                    {topic}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">Did you know?</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Using AI to quiz yourself twice a week increases retention rates by up to 40% compared to just reading.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
