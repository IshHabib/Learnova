"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Radio, Users, Mic, Camera, Settings } from "lucide-react"
import { collection, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherLivePage() {
  const { user } = useUser()
  const db = useFirestore()

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: classes, isLoading } = useCollection(classesQuery)

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
              <div className="aspect-video bg-black rounded-2xl flex items-center justify-center relative overflow-hidden group">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Video className="h-10 w-10 text-white/50" />
                  </div>
                  <p className="text-white/70 text-sm font-medium">Camera & Microphone Access Required</p>
                  <Button variant="secondary" size="sm">Enable Devices</Button>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white"><Mic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white"><Camera className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="destructive" size="sm">Go Live</Button>
                  <Button variant="ghost" size="icon" className="text-white"><Settings className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Radio className="h-4 w-4 text-destructive animate-pulse" />
                      Streaming Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">You are currently offline. Select a class to start broadcasting.</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Active Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">0</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select Classroom</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : !classes || classes.length === 0 ? (
                <Card className="border-none shadow-sm p-6 text-center italic text-sm text-muted-foreground">
                  Create a class first to start a live lecture.
                </Card>
              ) : (
                <div className="space-y-3">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-4 rounded-xl bg-white shadow-sm border border-transparent hover:border-primary/30 cursor-pointer transition-all">
                      <h4 className="text-sm font-bold">{cls.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{cls.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}