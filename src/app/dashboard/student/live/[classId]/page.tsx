"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, MessageSquare, Send, Users, Radio, AlertCircle, Video } from "lucide-react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function StudentLiveLecturePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const classId = params.classId as string

  const classRef = useMemoFirebase(() => doc(db, "classes", classId), [db, classId])
  const { data: classData, isLoading } = useDoc(classRef)

  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, user: "System", text: "Welcome to the live lecture! Please be respectful in chat.", isSystem: true },
  ])

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now(),
      user: user?.displayName || "Student",
      text: chatMessage,
      isSystem: false
    }])
    setChatMessage("")
  }

  if (isLoading) return <div className="p-8">Connecting to session...</div>

  if (!classData?.isLive) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold">Lecture Offline</h2>
            <p className="text-muted-foreground mb-6">This class is not currently broadcasting live.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset className="flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <h1 className="text-lg font-semibold font-headline">Live: {classData.name}</h1>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video Feed Area */}
          <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4">
               <div className="aspect-video w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative border-2 border-slate-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Radio className="h-12 w-12 text-red-500 animate-pulse mx-auto mb-4" />
                      <p className="text-white font-bold text-lg">LIVE FEED CONNECTED</p>
                      <p className="text-white/40 text-xs">Simulated stream from your instructor</p>
                    </div>
                  </div>
                  
                  {/* Overlays */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Live
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg">
                    <Users className="h-3 w-3" />
                    <span>24 students watching</span>
                  </div>
               </div>
            </div>
            
            {/* Viewer Info Bar */}
            <div className="h-24 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center px-8 gap-6">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <Video className="h-6 w-6 text-white/40" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-white font-bold text-lg">{classData.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-[10px] uppercase tracking-widest">{classData.subject}</span>
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">• Interactive Session</span>
                  </div>
                </div>
            </div>
          </div>

          {/* Chat Panel Area */}
          <div className="w-full lg:w-96 border-l bg-card flex flex-col h-[400px] lg:h-full shadow-2xl z-10">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Classroom Chat
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-slate-50/30">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className="text-xs">
                    {m.isSystem ? (
                      <p className="text-muted-foreground italic text-center py-3 px-4 bg-white border border-dashed rounded-xl mb-4">{m.text}</p>
                    ) : (
                      <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-1">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{m.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-primary flex items-center justify-between">
                            {m.user}
                            <span className="text-[8px] text-muted-foreground font-normal">Just now</span>
                          </p>
                          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                            {m.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border focus-within:ring-2 ring-primary/20 transition-all">
                <Input 
                  placeholder="Ask a question..." 
                  className="border-none shadow-none focus-visible:ring-0 text-xs h-9 bg-transparent" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" className="h-9 w-9 rounded-lg" onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
