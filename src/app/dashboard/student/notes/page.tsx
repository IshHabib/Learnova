
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Sparkles, Search } from "lucide-react"
import { collectionGroup, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentNotesPage() {
  const { user } = useUser()
  const db = useFirestore()

  // Fetch all notes for classes where the student is a member
  // Note: Backend schema specifies classStudentIds array in Note document
  const notesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collectionGroup(db, "notes"), where("classStudentIds", "array-contains", user.uid))
  }, [db, user?.uid])

  const { data: notes, isLoading } = useCollection(notesQuery)

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
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No materials found</h3>
              <p className="text-sm text-muted-foreground">Your instructors haven't uploaded any study materials for your classes yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer">
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
                    <CardDescription className="text-[10px]">Updated recently</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                      <Download className="mr-2 h-3 w-3" />
                      View Material
                    </Button>
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
