
"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Video, BookOpen, ChevronLeft, Eye, PlayCircle, Clock, Sparkles, BookText } from "lucide-react"
import { doc, collection } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const classId = params.classId as string

  const [viewingNote, setViewingNote] = useState<any | null>(null)

  const classRef = useMemoFirebase(() => doc(db, "classes", classId), [db, classId])
  const { data: classData, isLoading: classLoading } = useDoc(classRef)

  const notesRef = useMemoFirebase(() => collection(db, "classes", classId, "notes"), [db, classId])
  const { data: notes, isLoading: notesLoading } = useCollection(notesRef)

  const videosRef = useMemoFirebase(() => collection(db, "classes", classId, "videos"), [db, classId])
  const { data: videos, isLoading: videosLoading } = useCollection(videosRef)

  const quizzesRef = useMemoFirebase(() => collection(db, "classes", classId, "quizzes"), [db, classId])
  const { data: quizzes, isLoading: quizzesLoading } = useCollection(quizzesRef)

  if (classLoading) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <h1 className="text-lg font-semibold font-headline">{classData?.name}</h1>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-headline mb-2">{classData?.name}</h2>
            <p className="text-muted-foreground">{classData?.subject} • {classData?.description || "Digital Learning Environment"}</p>
          </div>

          <Tabs defaultValue="notes" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Quizzes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notesLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
                ) : !notes || notes.length === 0 ? (
                  <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                    <p className="text-muted-foreground">No notes posted yet.</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setViewingNote(note)}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {note.isAIGenerated && <Sparkles className="h-3 w-3 text-accent" />}
                        </div>
                        <CardTitle className="text-sm font-bold">{note.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full text-xs">View Material</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videosLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
                ) : !videos || videos.length === 0 ? (
                  <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                    <p className="text-muted-foreground">No videos available.</p>
                  </div>
                ) : (
                  videos.map(video => (
                    <Card key={video.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                      <div className="aspect-video bg-slate-900 flex items-center justify-center relative cursor-pointer" onClick={() => window.open(video.videoUrl)}>
                        <PlayCircle className="h-10 w-10 text-white/80" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      </div>
                      <CardHeader className="p-3">
                        <CardTitle className="text-xs font-bold truncate">{video.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3" />
                          {video.durationMinutes} mins
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="quizzes">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzesLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
                ) : !quizzes || quizzes.length === 0 ? (
                  <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                    <p className="text-muted-foreground">No quizzes assigned.</p>
                  </div>
                ) : (
                  quizzes.map(quiz => (
                    <Card key={quiz.id} className="border-none shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <BookText className="h-5 w-5 text-primary mb-2" />
                        <CardTitle className="text-sm font-bold">{quiz.title}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{quiz.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full text-xs" size="sm" onClick={() => router.push(`/dashboard/student/quizzes`)}>
                          Go to Assessments
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <header className="p-6 border-b bg-white">
              <DialogTitle className="text-xl font-headline text-primary">{viewingNote?.title}</DialogTitle>
              <DialogDescription className="mt-1">Classroom Material</DialogDescription>
            </header>
            <ScrollArea className="flex-1 p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto">
                {viewingNote?.content ? (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    {viewingNote.content}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-2xl border border-dashed">
                    <p className="text-muted-foreground mb-4">This material is hosted externally.</p>
                    <Button onClick={() => window.open(viewingNote?.contentUrl)}>Open External Resource</Button>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 border-t bg-white">
              <Button onClick={() => setViewingNote(null)}>Close Reader</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
