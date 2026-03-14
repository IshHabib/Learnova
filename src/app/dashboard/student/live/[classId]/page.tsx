
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronLeft, 
  MessageSquare, 
  Send, 
  Users, 
  Radio, 
  AlertCircle, 
  Video as VideoIcon, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Wifi,
  Activity,
  Maximize2,
  Zap,
  RefreshCw
} from "lucide-react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function StudentLiveLecturePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const classId = params.classId as string

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, user: "System", text: "Connected to Zenstream RTMP Gateway. Low-latency broadcast optimized.", isSystem: true },
  ])
  const [participantCount, setParticipantCount] = useState(0)
  const [connectionError, setConnectionError] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const classRef = useMemoFirebase(() => doc(db, "classes", classId), [db, classId])
  const { data: classData, isLoading, error } = useDoc(classRef)

  // Connection timeout check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !classData) {
        setConnectionError(true)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [isLoading, classData])

  useEffect(() => {
    setParticipantCount(Math.floor(Math.random() * 20) + 10)

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setHasCameraPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  }

  if (connectionError || error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Connection Issues</h2>
        <p className="text-slate-400 mb-6 max-w-md">We're having trouble connecting to the classroom server. This could be due to network restrictions or server maintenance.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>Go Dashboard</Button>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 flex items-center justify-center gap-3 bg-slate-950 text-white h-screen w-full"><Activity className="animate-spin text-primary" /> <span className="font-bold tracking-widest uppercase text-xs">Negotiating Zenstream Handshake...</span></div>

  if (!classData?.isLive) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
            <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold font-headline mb-2">Lecture Terminated</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">The broadcast for this class has ended or has not started yet. Please check back later.</p>
            <Button size="lg" className="rounded-full px-8" onClick={() => router.back()}>Return to Dashboard</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset className="flex flex-col overflow-hidden bg-slate-950">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 bg-black/40 backdrop-blur-xl z-20">
          <SidebarTrigger className="-ml-1 text-white/50" />
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Leave
          </Button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <h1 className="text-sm font-bold font-headline text-white flex items-center gap-2">
            <Radio className="h-3 w-3 text-red-500 animate-pulse" />
            LIVE: {classData.name}
          </h1>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Zenstream 1080p</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">High Speed</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-slate-950">
               <div className="aspect-video w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative border-4 border-white/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center z-10">
                      <Zap className="h-16 w-16 text-primary animate-pulse mx-auto mb-6" />
                      <p className="text-white font-extrabold text-2xl tracking-tight mb-2 uppercase">Zenstream Broadcast</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Receiving Low Latency RTMP Stream</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-40" />
                  </div>
                  
                  <div className="absolute bottom-6 right-6 w-40 md:w-56 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 group">
                    <video 
                      ref={videoRef} 
                      className={cn("w-full h-full object-cover mirror", !isCameraOn && "hidden")} 
                      autoPlay 
                      muted 
                      playsInline
                    />
                    {!isCameraOn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        <CameraOff className="h-8 w-8 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      You (Student)
                    </div>
                  </div>

                  <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      Live
                    </div>
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-4 py-2 rounded-full shadow-lg border border-white/10 font-bold uppercase tracking-wider">
                      <Users className="h-3 w-3 text-primary" />
                      <span>{participantCount} Participants</span>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
               </div>
            </div>
            
            <div className="h-24 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between px-8 z-20">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <VideoIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <h2 className="text-white font-bold text-lg leading-none mb-1">{classData.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-bold text-[10px] uppercase tracking-widest">{classData.subject}</span>
                      <span className="text-white/30 text-[10px] uppercase tracking-widest">• Zenstream Interactive</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant={isMicOn ? "secondary" : "destructive"} 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl transition-all hover:scale-105"
                    onClick={toggleMic}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant={isCameraOn ? "secondary" : "destructive"} 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl transition-all hover:scale-105"
                    onClick={toggleCamera}
                  >
                    {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                  </Button>
                  <div className="h-6 w-px bg-white/10 mx-2" />
                  <Button variant="destructive" className="rounded-2xl px-8 h-12 font-bold shadow-xl shadow-red-900/20" onClick={() => router.back()}>
                    Leave Session
                  </Button>
                </div>
            </div>
          </div>

          <div className="w-full lg:w-[400px] border-l border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col h-[450px] lg:h-full z-10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-2 text-white/80 uppercase tracking-widest">
                <MessageSquare className="h-4 w-4 text-primary" />
                Live Chat
              </h3>
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((m) => (
                  <div key={m.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {m.isSystem ? (
                      <div className="text-[10px] text-primary/70 font-bold text-center py-2 px-4 bg-primary/5 border border-primary/20 rounded-xl uppercase tracking-wider">
                        {m.text}
                      </div>
                    ) : (
                      <div className={cn("flex gap-3", m.user === user?.displayName ? "flex-row-reverse" : "")}>
                        <Avatar className="h-8 w-8 rounded-xl border border-white/10 ring-2 ring-white/5">
                          <AvatarFallback className="bg-white/5 text-white/50 text-[10px] font-bold">{m.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn("flex-1 space-y-1.5", m.user === user?.displayName ? "text-right" : "")}>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{m.user}</p>
                          <div className={cn(
                            "inline-block p-3 rounded-2xl text-xs max-w-[90%]",
                            m.user === user?.displayName 
                              ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20" 
                              : "bg-white/5 text-white/90 rounded-tl-none border border-white/10"
                          )}>
                            {m.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-6 border-t border-white/10 bg-black/20">
              <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 focus-within:ring-2 ring-primary/40 transition-all">
                <Input 
                  placeholder="Share your thoughts..." 
                  className="border-none shadow-none focus-visible:ring-0 text-sm h-10 bg-transparent text-white placeholder:text-white/20" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80" onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </SidebarProvider>
  )
}
