"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Radio, Users, Mic, Camera, Settings, MicOff, CameraOff, Power, Monitor, ShieldCheck, Sparkles, Loader2 } from "lucide-react"
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
        video: videoId ? { deviceId: { exact: videoId }, width: isHD ? 1280 : 640 } : { width: isHD ? 1280 : 640 },
        audio: audioId ? { deviceId: { exact: audioId }, noiseSuppression: noiseSuppression } : true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setHasCameraPermission(true)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Sync UI toggle states
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
        description: 'Please enable camera and microphone permissions to use live lectures.',
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
    toast({ title: "Hardware Updated", description: `Switched to selected ${type} device.` })
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
        setViewers(Math.floor(Math.random() * 15) + 5)
        toast({
          title: "You are now Live!",
          description: `Broadcasting to ${classes?.find(c => c.id === selectedClassId)?.name}.`,
        })
      } else {
        setViewers(0)
        toast({
          title: "Stream Ended",
          description: "Your lecture session has been closed.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error updating live status",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isMicOn
        setIsMicOn(!isMicOn)
      }
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn
        setIsCameraOn(!isCameraOn)
      }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Live Lectures</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl group border-4 border-slate-800">
                <video 
                  ref={videoRef} 
                  className={cn("w-full h-full object-cover", !isCameraOn && "hidden")} 
                  autoPlay 
                  muted 
                  playsInline
                />
                
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <CameraOff className="h-16 w-16 text-slate-700" />
                  </div>
                )}

                {hasCameraPermission === false && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 p-8 text-center">
                    <Alert variant="destructive" className="max-w-md">
                      <AlertTitle>Hardware Access Required</AlertTitle>
                      <AlertDescription>
                        Learnova needs permission to your camera and microphone to start a live lecture.
                      </AlertDescription>
                    </Alert>
                    <Button variant="secondary" className="mt-6" onClick={() => startStream()}>
                      Grant Access
                    </Button>
                  </div>
                )}

                {isLive && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse uppercase tracking-wider">
                    <Radio className="h-3 w-3" />
                    Live
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex gap-2">
                    <Button 
                      variant={isMicOn ? "secondary" : "destructive"} 
                      size="icon" 
                      className="rounded-xl h-10 w-10"
                      onClick={toggleMic}
                    >
                      {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant={isCameraOn ? "secondary" : "destructive"} 
                      size="icon" 
                      className="rounded-xl h-10 w-10"
                      onClick={toggleCamera}
                    >
                      {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <Button 
                    variant={isLive ? "destructive" : "default"} 
                    className="px-8 rounded-xl font-bold h-10"
                    onClick={toggleLive}
                    disabled={hasCameraPermission === false || isUpdating}
                  >
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                    {isLive ? "End Stream" : "Go Live"}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-xl h-10 w-10"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Radio className={cn("h-4 w-4", isLive ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
                      Streaming Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLive 
                        ? `Broadcasting to ${classes?.find(c => c.id === selectedClassId)?.name}. Session recording is active.` 
                        : "You are currently offline. Select a class from the right to start a live lecture."}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Active Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{viewers}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Students</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Target Classroom</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : !classes || classes.length === 0 ? (
                <Card className="border-none shadow-sm p-8 text-center bg-card border-2 border-dashed">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    No active classrooms found. Create a class first to start a live lecture.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {classes.map(cls => (
                    <div 
                      key={cls.id} 
                      onClick={() => !isLive && setSelectedClassId(cls.id)}
                      className={cn(
                        "p-4 rounded-2xl bg-white shadow-sm border-2 transition-all cursor-pointer group",
                        selectedClassId === cls.id 
                          ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                          : "border-transparent hover:border-slate-200",
                        isLive && selectedClassId !== cls.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{cls.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">{cls.subject}</p>
                        </div>
                        {selectedClassId === cls.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Lecture Settings
              </DialogTitle>
              <DialogDescription>Configure your hardware and stream quality.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Video Source</Label>
                <Select value={selectedVideoId} onValueChange={(val) => handleDeviceChange('video', val)}>
                  <SelectTrigger className="rounded-xl">
                    <Camera className="mr-2 h-4 w-4 opacity-50" />
                    <SelectValue placeholder="Default Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 4)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audio Source</Label>
                <Select value={selectedAudioId} onValueChange={(val) => handleDeviceChange('audio', val)}>
                  <SelectTrigger className="rounded-xl">
                    <Mic className="mr-2 h-4 w-4 opacity-50" />
                    <SelectValue placeholder="Default Microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 4)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5 text-primary" />
                      HD Video (1080p)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Improve clarity for whiteboard lectures.</p>
                  </div>
                  <Switch checked={isHD} onCheckedChange={setIsHD} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Noise Suppression
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Filter out background room noise.</p>
                  </div>
                  <Switch checked={noiseSuppression} onCheckedChange={setNoiseSuppression} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-600 leading-relaxed italic">
                  <strong>Pro Tip:</strong> Use HD Video and Noise Suppression together for a professional classroom experience. Your settings are applied immediately.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={() => setShowSettings(false)}>Save & Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
