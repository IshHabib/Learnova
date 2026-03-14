
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Search, Sparkles, Trash2, ExternalLink, Loader2, Wand2, Eye, BookOpen, BookText } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
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

  // State for Quiz Creation
  const [showQuizCreate, setShowQuizCreate] = useState(false)
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false)
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    classId: "",
    questions: [
      { questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }
    ]
  })

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
        try {
          const notesSnap = await getDocs(collection(db, "classes", classId, "notes"))
          notesSnap.forEach(doc => {
            allNotes.push({ id: doc.id, ...doc.data(), classId, type: 'note' })
          })
          const quizzesSnap = await getDocs(collection(db, "classes", classId, "quizzes"))
          quizzesSnap.forEach(doc => {
            allNotes.push({ id: doc.id, ...doc.data(), classId, type: 'quiz' })
          })
        } catch (err) {
          console.warn(`Could not fetch content for class ${classId}`)
        }
      }
      
      setContent(allNotes)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [db, user?.uid])

  const handleDelete = async (classId: string, noteId: string, type: 'note' | 'quiz') => {
    try {
      const collectionName = type === 'note' ? 'notes' : 'quizzes'
      await deleteDoc(doc(db, "classes", classId, collectionName, noteId))
      toast({ title: "Content deleted successfully" })
    } catch (error: any) {
      toast({ 
        title: "Error deleting content", 
        description: error.message,
        variant: "destructive" 
      })
    }
  }

  const handleCreateQuiz = async () => {
    if (!user || !quizData.title || !quizData.classId) return
    setIsCreatingQuiz(true)
    try {
      const quizRef = collection(db, "classes", quizData.classId, "quizzes")
      await addDoc(quizRef, {
        ...quizData,
        teacherId: user.uid,
        creationDate: new Date().toISOString(),
        isAIGenerated: false,
        maxScore: 100
      })
      toast({ title: "Quiz Assigned!", description: "Students in the class can now take this quiz." })
      setShowQuizCreate(false)
      setQuizData({
        title: "",
        description: "",
        classId: "",
        questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }]
      })
    } catch (error: any) {
      toast({ title: "Error creating quiz", description: error.message, variant: "destructive" })
    } finally {
      setIsCreatingQuiz(false)
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

  const handleView = (item: any) => {
    if (item.type === 'note') {
      if (item.isAIGenerated || item.content) {
        setViewingNote(item)
      } else {
        window.open(item.contentUrl)
      }
    } else {
      toast({ title: "Quiz Review", description: "Quiz content editing coming soon." })
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
              <Button variant="outline" size="sm" onClick={() => setShowAiGen(true)}>
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                AI Generate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowQuizCreate(true)}>
                <BookText className="mr-2 h-4 w-4" />
                Assign Quiz
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Note
              </Button>
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
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Populate your classes with notes, quizzes, and resources.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map(item => (
                <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className={`h-1.5 w-full ${item.type === 'quiz' ? 'bg-accent' : item.isAIGenerated ? 'bg-primary' : 'bg-slate-300'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center">
                        {item.type === 'quiz' ? <BookText className="h-4 w-4 text-accent" /> : <FileText className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.type}
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold mt-2 truncate">{item.title}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {classes?.find(c => c.id === item.classId)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 h-8 text-[10px]" onClick={() => handleView(item)}>
                      <Eye className="mr-1.5 h-3 w-3" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] text-destructive hover:bg-destructive/5" onClick={() => handleDelete(item.classId, item.id, item.type)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* AI GEN DIALOG */}
        <Dialog open={showAiGen} onOpenChange={setShowAiGen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Study Note Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input placeholder="e.g. Photosynthesis" value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select onValueChange={setAiClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                  <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAiGenerate} disabled={isAiGenerating || !aiTopic.trim() || !aiClassId}>
                {isAiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate & Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QUIZ CREATE DIALOG */}
        <Dialog open={showQuizCreate} onOpenChange={setShowQuizCreate}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Assign Classroom Quiz</DialogTitle>
              <DialogDescription>Create a basic assessment for your students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input value={quizData.title} onChange={e => setQuizData({...quizData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Classroom</Label>
                  <Select onValueChange={val => setQuizData({...quizData, classId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                    <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={quizData.description} onChange={e => setQuizData({...quizData, description: e.target.value})} />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-bold mb-4">Questions (Prototype Mode: 1 Required)</h4>
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Input 
                    placeholder="Question Text" 
                    value={quizData.questions[0].questionText} 
                    onChange={e => {
                      const qs = [...quizData.questions];
                      qs[0].questionText = e.target.value;
                      setQuizData({...quizData, questions: qs});
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {quizData.questions[0].options.map((opt, i) => (
                      <Input 
                        key={i} 
                        placeholder={`Option ${i+1}`} 
                        value={opt} 
                        onChange={e => {
                          const qs = [...quizData.questions];
                          qs[0].options[i] = e.target.value;
                          setQuizData({...quizData, questions: qs});
                        }}
                      />
                    ))}
                  </div>
                  <Input 
                    placeholder="Correct Answer (must match one option exactly)" 
                    value={quizData.questions[0].correctAnswer} 
                    onChange={e => {
                      const qs = [...quizData.questions];
                      qs[0].correctAnswer = e.target.value;
                      setQuizData({...quizData, questions: qs});
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateQuiz} disabled={isCreatingQuiz || !quizData.title || !quizData.classId}>
                {isCreatingQuiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Quiz to Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UPLOAD DIALOG */}
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select onValueChange={val => setNewNote({...newNote, classId: val})}>
                  <SelectTrigger><SelectValue placeholder="Choose class..." /></SelectTrigger>
                  <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>External URL</Label>
                <Input placeholder="https://..." value={newNote.contentUrl} onChange={e => setNewNote({...newNote, contentUrl: e.target.value})} />
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

        {/* VIEWER DIALOG */}
        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <header className="p-6 border-b bg-white">
              <DialogTitle className="text-xl font-headline text-primary">{viewingNote?.title}</DialogTitle>
            </header>
            <ScrollArea className="flex-1 p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto">
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  {viewingNote?.content || "No content data available for this preview."}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 border-t bg-white">
              <Button onClick={() => setViewingNote(null)}>Close Viewer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
