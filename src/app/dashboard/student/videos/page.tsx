"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Clock, Sparkles } from "lucide-react"
import { collectionGroup, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentVideosPage() {
  const { user } = useUser()
  const db = useFirestore()

  // Fetch all videos where student is in the classStudentIds list
  const videosQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collectionGroup(db, "videos"), 
      where("classStudentIds", "array-contains", user.uid)
    )
  }, [db, user?.uid])

  const { data: videos, isLoading } = useCollection(videosQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Video Lessons</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : !videos || videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/5">
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No videos available</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your instructors haven't posted any video lessons yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Card key={video.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
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
                    <CardDescription className="flex items-center gap-2 text-[10px]">
                      <Clock className="h-3 w-3" />
                      {video.durationMinutes} mins
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => window.open(video.videoUrl)}>Watch Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
