"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Clock, Sparkles, Loader2, Radio } from "lucide-react"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentVideosPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch live classes
  const liveClassesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "classes"),
      where("studentIds", "array-contains", user.uid),
      where("isLive", "==", true)
    )
  }, [db, user?.uid])
  const { data: liveClasses, isLoading: liveLoading } = useCollection(liveClassesQuery)

  useEffect(() => {
    if (!db || !user?.uid) return

    // Fetch classes the student belongs to
    const classesQuery = query(
      collection(db, "classes"),
      where("studentIds", "array-contains", user.uid)
    )

    const unsubscribe = onSnapshot(classesQuery, async (snapshot) => {
      const classIds = snapshot.docs.map(doc => doc.id)
      
      if (classIds.length === 0) {
        setVideos([])
        setIsLoading(false)
        return
      }

      // Fetch videos for each class individually to avoid index requirements
      const allVideos: any[] = []
      for (const classId of classIds) {
        const videosSnap = await getDocs(collection(db, "classes", classId, "videos"))
        videosSnap.forEach(doc => {
          allVideos.push({ id: doc.id, ...doc.data(), className: snapshot.docs.find(d => d.id === classId)?.data()?.name })
        })
      }
      
      setVideos(allVideos)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [db, user?.uid])

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Video Library</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* Active Live Sessions Section */}
          {liveClasses && liveClasses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse" />
                Active Live Lectures
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liveClasses.map(cls => (
                  <Card key={cls.id} className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-white/20 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Live Now
                        </div>
                      </div>
                      <CardTitle className="text-sm font-bold">{cls.name}</CardTitle>
                      <CardDescription className="text-primary-foreground/70 text-[10px] uppercase font-medium">{cls.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs font-bold"
                        onClick={() => router.push(`/dashboard/student/live/${cls.id}`)}
                      >
                        Join Lecture
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Static Videos Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Classroom Recordings</h2>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No recordings found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your instructors haven't posted any recorded video lessons yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <Card key={video.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer" onClick={() => window.open(video.videoUrl)}>
                      <PlayCircle className="h-12 w-12 text-white/80 group-hover:scale-110 transition-transform z-10" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      {video.isAIGeneratedSuggestion && (
                        <div className="absolute top-2 right-2 bg-accent/90 text-white text-[8px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                          <Sparkles className="h-2 w-2" />
                          AI Recommended
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold truncate">{video.title}</CardTitle>
                      <div className="flex items-center justify-between mt-1">
                        <CardDescription className="text-[10px] font-medium uppercase">{video.className}</CardDescription>
                        <CardDescription className="flex items-center gap-2 text-[10px]">
                          <Clock className="h-3 w-3" />
                          {video.durationMinutes} mins
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => window.open(video.videoUrl)}>Watch Recording</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
