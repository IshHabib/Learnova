
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Search, Sparkles, Trash2, ExternalLink, Loader2, Wand2, Eye, X, BookOpen } from "lucide-react"
import { collection, query, where, doc, deleteDoc, addDoc, getDocs, onSnapshot } from "firebase/firestore"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateStudyNotes } from "@/ai/flows/generate-study-notes"

export default function TeacherContentPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [content, setContent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // State for manual upload
  const [isUploading, setIsUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", classId: "", contentUrl: "" })

  // State for AI Generation
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [showAiGen, setShowAiGen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiClassId, setAiClassId] = useState("")

  // State for Viewing Note
  const [viewingNote, setViewingNote] = useState<any | null>(null)

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: classes } = useCollection(classesQuery)

  useEffect(() => {
    if (!db || !user?.uid) return

    const q = query(collection(db, "classes"), where("teacherId", "==", user.uid))
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const classIds = snapshot.docs.map(doc => doc.id)
      
      if (classIds.length === 0) {
        setContent([])
        setIsLoading(false)
        return
      }

      const allNotes: any[] = []
      for (const classId of classIds) {
        const notesSnap = await getDocs(collection(db, "classes", classId, "notes"))
        notesSnap.forEach(doc => {
          allNotes.push({ id: doc.id, ...doc.data(), classId })
        })
      }
      
      setContent(allNotes)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [db, user?.uid])

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

  const handleAiGenerate = async () => {
    if (!user || !aiTopic.trim() || !aiClassId) return
    setIsAiGenerating(true)
    try {
      const selectedClass = classes?.find(c => c.id === aiClassId)
      if (!selectedClass) throw new Error("Class not found")

      const result = await generateStudyNotes({ topic: aiTopic })
      
      const notesRef = collection(db, "classes", aiClassId, "notes")
      await addDoc(notesRef, {
        title: `${aiTopic} - AI Study Notes`,
        contentUrl: "data:text/markdown;base64," + btoa(result.notes),
        content: result.notes, 
        classId: aiClassId,
        teacherId: user.uid,
        classTeacherId: user.uid,
        classStudentIds: selectedClass.studentIds || [],
        uploadDate: new Date().toISOString(),
        isAIGenerated: true,
        topics: [aiTopic]
      })

      toast({ 
        title: "AI Notes Generated!", 
        description: `Successfully created and posted for ${selectedClass.name}.` 
      })
      setAiTopic("")
      setShowAiGen(false)
    } catch (error: any) {
      toast({ 
        title: "AI Generation Failed", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setIsAiGenerating(false)
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

  const handleView = (note: any) => {
    if (note.isAIGenerated || note.content) {
      setViewingNote(note)
    } else {
      window.open(note.contentUrl)
    }
  }

  const filteredContent = content.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Content Library</h1>
            <div className="flex gap-2">
              <Dialog open={showAiGen} onOpenChange={setShowAiGen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    AI Generate Notes
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-primary" />
                      AI Study Note Generator
                    </DialogTitle>
                    <DialogDescription>
                      Our AI engine will create structured, detailed study notes based on your topic.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Topic or Subject</Label>
                      <Input 
                        placeholder="e.g. Photosynthesis, Civil War, Python Basics..." 
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Class</Label>
                      <Select onValueChange={setAiClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select classroom..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAiGenerate} disabled={isAiGenerating || !aiTopic.trim() || !aiClassId}>
                      {isAiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isAiGenerating ? "Generating..." : "Generate & Post"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Material</DialogTitle>
                    <DialogDescription>Share PDFs, Slides, or External Resources.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="Lecture 1: Intro" 
                        value={newNote.title}
                        onChange={e => setNewNote({...newNote, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Class</Label>
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
                      <Label>Resource URL</Label>
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
                      Post Material
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8 relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10 text-sm"
              placeholder="Filter library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-24 bg-muted/5 rounded-2xl border-2 border-dashed">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-bold">Library is empty</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Use the AI engine to generate detailed study notes or upload your own files to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map(item => (
                <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className={`h-1.5 w-full ${item.isAIGenerated ? 'bg-primary' : 'bg-slate-300'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      {item.isAIGenerated && (
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[8px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-2 w-2" />
                          AI Created
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold mt-2 truncate">{item.title}</CardTitle>
                    <CardDescription className="text-[10px] flex items-center gap-1">
                      Posted {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : "Recently"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 h-8 text-[10px]" onClick={() => handleView(item)}>
                      <Eye className="mr-1.5 h-3 w-3" />
                      View Material
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => handleDelete(item.classId, item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-headline text-primary flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {viewingNote?.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Classroom Resource • {viewingNote?.isAIGenerated ? 'AI Generated' : 'Upload'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
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
