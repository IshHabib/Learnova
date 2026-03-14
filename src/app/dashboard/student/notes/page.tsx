
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Sparkles, Search, Loader2, BookOpen, Eye, ExternalLink } from "lucide-react"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function StudentNotesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [notes, setNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewingNote, setViewingNote] = useState<any | null>(null)

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
        setNotes([])
        setIsLoading(false)
        return
      }

      // Fetch notes for each class individually to avoid index requirements
      try {
        const allNotes: any[] = []
        for (const classId of classIds) {
          const notesSnap = await getDocs(collection(db, "classes", classId, "notes"))
          notesSnap.forEach(doc => {
            allNotes.push({ id: doc.id, ...doc.data(), classId })
          })
        }
        setNotes(allNotes)
      } catch (error) {
        console.error("Error fetching notes:", error)
      } finally {
        setIsLoading(false)
      }
    }, (error) => {
      console.error("Classes snapshot error:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [db, user?.uid])

  const handleView = (note: any) => {
    if (note.isAIGenerated || note.content) {
      setViewingNote(note)
    } else {
      window.open(note.contentUrl)
    }
  }

  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Study Notes</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8 max-w-md relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input 
              className="w-full bg-white border rounded-lg py-2 pl-10 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="Search concepts or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/5">
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No materials found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Your instructors haven't uploaded any study materials yet. Make sure you have joined your active classes using a class code.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard/student/classes"}>
                Go to Classrooms
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleView(note)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      {note.isAIGenerated && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase">
                          <Sparkles className="h-3 w-3" />
                          <span>AI Gen</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{note.title}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {note.uploadDate ? `Posted ${new Date(note.uploadDate).toLocaleDateString()}` : "Recently updated"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                      <Eye className="mr-2 h-3 w-3" />
                      Open Material
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <header className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-headline text-primary flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {viewingNote?.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Classroom Resource • {viewingNote?.isAIGenerated ? 'AI Generated Study Notes' : 'Instructor Upload'}
                  </DialogDescription>
                </div>
              </div>
            </header>
            <ScrollArea className="flex-1 p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto">
                {viewingNote?.content ? (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    {viewingNote.content}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-2xl border border-dashed">
                    <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground mb-4">This material is hosted externally.</p>
                    <Button onClick={() => window.open(viewingNote?.contentUrl)}>
                      Open in New Tab <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
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
