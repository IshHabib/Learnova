"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Search, Sparkles, Trash2, ExternalLink, Loader2 } from "lucide-react"
import { collectionGroup, query, where, doc, deleteDoc, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TeacherContentPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", classId: "", contentUrl: "" })

  const contentQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collectionGroup(db, "notes"), where("classTeacherId", "==", user.uid))
  }, [db, user?.uid])

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: content, isLoading } = useCollection(contentQuery)
  const { data: classes } = useCollection(classesQuery)

  const handleDelete = async (classId: string, noteId: string) => {
    try {
      await deleteDoc(doc(db, "classes", classId, "notes", noteId))
      toast({ title: "Content deleted successfully" })
    } catch (error: any) {
      toast({ 
        title: "Error deleting content", 
        description: error.message,
        variant: "destructive" 
      })
    }
  }

  const handleUpload = async () => {
    if (!user || !newNote.title || !newNote.classId) return
    setIsUploading(true)
    try {
      const selectedClass = classes?.find(c => c.id === newNote.classId)
      if (!selectedClass) throw new Error("Class not found")

      const notesRef = collection(db, "classes", newNote.classId, "notes")
      await addDoc(notesRef, {
        title: newNote.title,
        contentUrl: newNote.contentUrl || "https://example.com/sample.pdf",
        classId: newNote.classId,
        teacherId: user.uid,
        classTeacherId: user.uid,
        classStudentIds: selectedClass.studentIds || [],
        uploadDate: new Date().toISOString(),
        isAIGenerated: false,
        topics: []
      })

      toast({ title: "Success", description: "Material uploaded to class." })
      setNewNote({ title: "", classId: "", contentUrl: "" })
      setShowUpload(false)
    } catch (error: any) {
      toast({ title: "Error uploading", description: error.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Content Library</h1>
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                  <DialogDescription>Share notes or documents with a specific class.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      placeholder="Chapter 1: Intro to Physics" 
                      value={newNote.title}
                      onChange={e => setNewNote({...newNote, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Class</Label>
                    <Select onValueChange={val => setNewNote({...newNote, classId: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resource URL (PDF/Markdown)</Label>
                    <Input 
                      placeholder="https://..." 
                      value={newNote.contentUrl}
                      onChange={e => setNewNote({...newNote, contentUrl: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpload} disabled={isUploading || !newNote.title || !newNote.classId}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8 relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input 
              className="w-full bg-white border rounded-lg py-2 pl-10 text-sm focus:ring-2 ring-primary/20 outline-none"
              placeholder="Search library..."
            />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : !content || content.length === 0 ? (
            <div className="text-center py-24 bg-muted/5 rounded-2xl border-2 border-dashed">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-bold">No uploaded materials</h3>
              <p className="text-sm text-muted-foreground">Upload study notes, PDFs, or slides to share with your classes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-primary/5 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground">Shared with class</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => window.open(item.contentUrl)}><ExternalLink className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.classId, item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}