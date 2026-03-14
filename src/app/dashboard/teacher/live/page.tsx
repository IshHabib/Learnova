
"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Video as VideoIcon, 
  Radio, 
  Users, 
  Mic, 
  Camera, 
  Settings, 
  MicOff, 
  CameraOff, 
  Power, 
  Monitor, 
  ShieldCheck, 
  Sparkles, 
  Loader2,
  Users2,
  Activity,
  MessageSquare
} from "lucide-react"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function TeacherLivePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [viewers, setViewers] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Settings State
  const [showSettings, setShowSettings] = useState(false)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>("")
  const [selectedAudioId, setSelectedAudioId] = useState<string>("")
  const [isHD, setIsHD] = useState(true)
  const [noiseSuppression, setNoiseSuppression] = useState(true)

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: classes, isLoading } = useCollection(classesQuery)

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
    } catch (e) {
      console.error("Error enumerating devices:", e)
    }
  }

  const startStream = async (videoId?: string, audioId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: videoId ? { deviceId: { exact: videoId }, width: isHD ? 1920 : 1280 } : { width: isHD ? 1920 : 1280 },
        audio: audioId ? { deviceId: { exact: audioId }, noiseSuppression: noiseSuppression } : true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setHasCameraPermission(true)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]
      if (videoTrack) videoTrack.enabled = isCameraOn
      if (audioTrack) audioTrack.enabled = isMicOn

    } catch (error) {
      console.error('Error accessing hardware:', error)
      setHasCameraPermission(false)
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Learnova needs camera and mic access for live teaching.',
      })
    }
  }

  useEffect(() => {
    startStream()
    getDevices()
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleDeviceChange = async (type: 'video' | 'audio', id: string) => {
    if (type === 'video') {
      setSelectedVideoId(id)
      await startStream(id, selectedAudioId)
    } else {
      setSelectedAudioId(id)
      await startStream(selectedVideoId, id)
    }
  }

  const toggleLive = async () => {
    if (!selectedClassId) {
      toast({
        title: "Selection Required",
        description: "Please select a classroom before going live.",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    const classRef = doc(db, "classes", selectedClassId)
    const newStatus = !isLive

    try {
      await updateDoc(classRef, {
        isLive: newStatus,
        lastLiveAt: newStatus ? new Date().toISOString() : null
      })

      setIsLive(newStatus)
      if (newStatus) {
        setViewers(Math.floor(Math.random() * 25) + 15)
        toast({ title: "Live Broadcast Started", description: "Your students have been notified." })
      } else {
        setViewers(0)
        toast({ title: "Broadcast Ended" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks()[0].enabled = !isMicOn
      setIsMicOn(!isMicOn)
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks()[0].enabled = !isCameraOn
      setIsCameraOn(!isCameraOn)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset className="bg-slate-50/50">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-bold font-headline flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-primary" />
              Instructor Broadcast Studio
            </h1>
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">On Air</span>
              </div>
            )}
          </div>
        </header>
        
        <main className="p-4 md:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Main Studio Area */}
            <div className="lg:col-span-3 space-y-6">
              <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl group border-[12px] border-slate-800 ring-1 ring-slate-700/50">
                <video 
                  ref={videoRef} 
                  className={cn("w-full h-full object-cover", (!isCameraOn || hasCameraPermission === false) && "hidden")} 
                  autoPlay 
                  muted 
                  playsInline
                />
                
                {(!isCameraOn || hasCameraPermission === false) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-3xl">
                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                      <CameraOff className="h-8 w-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">Your camera is currently off</p>
                  </div>
                )}

                {/* Stream Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  <Button 
                    variant={isMicOn ? "secondary" : "destructive"} 
                    size="icon" 
                    className="rounded-2xl h-12 w-12"
                    onClick={toggleMic}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant={isCameraOn ? "secondary" : "destructive"} 
                    size="icon" 
                    className="rounded-2xl h-12 w-12"
                    onClick={toggleCamera}
                  >
                    {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                  </Button>
                  
                  <div className="w-px h-8 bg-white/10 mx-2" />

                  <Button 
                    variant={isLive ? "destructive" : "default"} 
                    className="px-10 rounded-2xl font-bold h-12 shadow-xl"
                    onClick={toggleLive}
                    disabled={hasCameraPermission === false || isUpdating}
                  >
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                    {isLive ? "End Lecture" : "Start Teaching"}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/10 rounded-2xl h-12 w-12"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Classroom grid (Simulated Presence) */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Classroom Engagement Grid
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {isLive ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="aspect-video bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-50 group-hover:bg-primary/5 transition-colors" />
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarFallback className="bg-slate-200 text-xs font-bold text-slate-500">{String.fromCharCode(65 + i)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Student {i+1}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-slate-50">
                      <Users className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400 font-medium italic">Student presence will appear here when you go live</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Stats</h3>
                <div className="grid gap-3">
                  <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-80">Live Viewers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="text-2xl font-black">{viewers}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session Time</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="text-2xl font-black text-slate-700">{isLive ? "00:42:15" : "00:00:00"}</div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Classroom</h3>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                  ) : classes?.map(cls => (
                    <div 
                      key={cls.id} 
                      onClick={() => !isLive && setSelectedClassId(cls.id)}
                      className={cn(
                        "p-4 rounded-2xl bg-white border-2 transition-all cursor-pointer",
                        selectedClassId === cls.id 
                          ? "border-primary bg-primary/[0.02] shadow-md ring-4 ring-primary/5" 
                          : "border-transparent hover:border-slate-200 shadow-sm",
                        isLive && selectedClassId !== cls.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <h4 className="text-sm font-bold truncate">{cls.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{cls.subject}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-5 rounded-3xl bg-white border shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Quick Tools
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col text-[8px] font-bold uppercase">
                    <Activity className="h-3 w-3 mb-1" />
                    Poll Class
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col text-[8px] font-bold uppercase">
                    <Monitor className="h-3 w-3 mb-1" />
                    Share Screen
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="rounded-3xl max-w-md border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Settings className="h-5 w-5" />
                Hardware Configuration
              </DialogTitle>
              <DialogDescription>Select your preferred inputs for the live broadcast.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Camera Device</Label>
                <Select value={selectedVideoId} onValueChange={(val) => handleDeviceChange('video', val)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none">
                    <Camera className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="rounded-xl">{d.label || `Camera ${d.deviceId.slice(0, 4)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Microphone Device</Label>
                <Select value={selectedAudioId} onValueChange={(val) => handleDeviceChange('audio', val)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none">
                    <Mic className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select Microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="rounded-xl">{d.label || `Microphone ${d.deviceId.slice(0, 4)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5 text-primary" />
                      Enhanced 1080p Video
                    </Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Increases bandwidth usage</p>
                  </div>
                  <Switch checked={isHD} onCheckedChange={setIsHD} />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      AI Noise Filter
                    </Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Suppresses room echo</p>
                  </div>
                  <Switch checked={noiseSuppression} onCheckedChange={setNoiseSuppression} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full rounded-2xl h-12 font-bold" onClick={() => { startStream(selectedVideoId, selectedAudioId); setShowSettings(false); }}>
                Update Session Config
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
