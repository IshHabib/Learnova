
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Search, Sparkles, Trash2, Eye, BookText, Loader2, BookOpen, X, Trophy, AlertCircle, User, CheckCircle2 } from "lucide-react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateStudyNotes } from "@/ai/flows/generate-study-notes"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

  // State for Viewing Content
  const [viewingNote, setViewingNote] = useState<any | null>(null)
  const [viewingQuiz, setViewingQuiz] = useState<any | null>(null)
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false)

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

      const allContent: any[] = []
      for (const classId of classIds) {
        try {
          const notesSnap = await getDocs(collection(db, "classes", classId, "notes"))
          notesSnap.forEach(doc => {
            allContent.push({ id: doc.id, ...doc.data(), classId, type: 'note' })
          })
          const quizzesSnap = await getDocs(collection(db, "classes", classId, "quizzes"))
          quizzesSnap.forEach(doc => {
            allContent.push({ id: doc.id, ...doc.data(), classId, type: 'quiz' })
          })
        } catch (err) {
          console.warn(`Could not fetch content for class ${classId}`)
        }
      }
      
      setContent(allContent)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [db, user?.uid])

  useEffect(() => {
    if (!viewingQuiz || !db || !user?.uid) return

    const fetchPerformance = async () => {
      setIsLoadingAttempts(true)
      const attempts: any[] = []
      const selectedClass = classes?.find(c => c.id === viewingQuiz.classId)
      
      if (selectedClass?.studentIds?.length) {
        for (const studentId of selectedClass.studentIds) {
          try {
            const q = query(
              collection(db, "users", studentId, "quizAttempts"),
              where("quizId", "==", viewingQuiz.id)
            )
            const snap = await getDocs(q)
            snap.forEach(doc => {
              attempts.push({ id: doc.id, ...doc.data() })
            })
          } catch (e) {
            console.error("Error fetching student attempt:", e)
          }
        }
      }
      setQuizAttempts(attempts)
      setIsLoadingAttempts(false)
    }

    fetchPerformance()
  }, [viewingQuiz, db, user?.uid, classes])

  const handleDelete = async (classId: string, contentId: string, type: 'note' | 'quiz') => {
    try {
      const collectionName = type === 'note' ? 'notes' : 'quizzes'
      await deleteDoc(doc(db, "classes", classId, collectionName, contentId))
      toast({ title: "Content deleted successfully" })
    } catch (error: any) {
      toast({ 
        title: "Error deleting content", 
        description: error.message,
        variant: "destructive" 
      })
    }
  }

  const handleAddQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }
      ]
    })
  }

  const handleRemoveQuestion = (index: number) => {
    if (quizData.questions.length <= 1) return
    const newQuestions = [...quizData.questions]
    newQuestions.splice(index, 1)
    setQuizData({ ...quizData, questions: newQuestions })
  }

  const handleCreateQuiz = async () => {
    if (!user || !quizData.title || !quizData.classId) return
    
    const isValid = quizData.questions.every(q => q.questionText.trim() !== "" && q.correctAnswer.trim() !== "")
    if (!isValid) {
      toast({ title: "Incomplete Quiz", description: "Please ensure all questions have text and a correct answer.", variant: "destructive" })
      return
    }

    setIsCreatingQuiz(true)
    try {
      const selectedClass = classes?.find(c => c.id === quizData.classId)
      const quizRef = collection(db, "classes", quizData.classId, "quizzes")
      
      await addDoc(quizRef, {
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions,
        teacherId: user.uid,
        classTeacherId: user.uid,
        classStudentIds: selectedClass?.studentIds || [],
        creationDate: new Date().toISOString(),
        isAIGenerated: false,
        maxScore: 100,
        classId: quizData.classId
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
      setViewingQuiz(item)
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
                      {item.type === 'quiz' ? 'Review Results' : 'View'}
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

        <Dialog open={!!viewingQuiz} onOpenChange={(open) => !open && setViewingQuiz(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <header className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-headline text-primary">{viewingQuiz?.title}</DialogTitle>
                  <DialogDescription className="mt-1">Classroom Assessment Review</DialogDescription>
                </div>
                {viewingQuiz?.isAIGenerated && <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" /> AI Generated</Badge>}
              </div>
            </header>
            
            <Tabs defaultValue="performance" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b bg-white">
                <TabsList className="bg-transparent border-b-0 h-12">
                  <TabsTrigger value="performance" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-12">
                    <Trophy className="h-4 w-4 mr-2" />
                    Student Performance
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-12">
                    <BookText className="h-4 w-4 mr-2" />
                    Quiz Structure
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="performance" className="h-full m-0">
                  <ScrollArea className="h-full p-6 bg-slate-50/30">
                    <div className="max-w-3xl mx-auto space-y-6 pb-10">
                      {isLoadingAttempts ? (
                        <div className="space-y-3">
                          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                      ) : quizAttempts.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-2xl">
                          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                          <p className="text-sm text-muted-foreground">No students have completed this quiz yet.</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {quizAttempts.map((attempt) => (
                            <Card key={attempt.id} className="border-none shadow-sm flex items-center justify-between p-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{attempt.studentName || "Learner"}</h4>
                                  <p className="text-[10px] text-muted-foreground">Submitted {new Date(attempt.submissionDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {attempt.score}%
                                  </p>
                                  {attempt.score < 70 && (
                                    <Badge variant="destructive" className="text-[8px] h-4 uppercase">Needs Improvement</Badge>
                                  )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="questions" className="h-full m-0">
                  <ScrollArea className="h-full p-6 bg-slate-50/30">
                    <div className="max-w-3xl mx-auto space-y-6 pb-10">
                      {viewingQuiz?.questions?.map((q: any, idx: number) => (
                        <Card key={idx} className="border-none shadow-sm overflow-hidden">
                          <div className="p-4 bg-primary/5 border-b flex items-center justify-between">
                            <span className="text-xs font-bold text-primary uppercase">Question {idx + 1}</span>
                            <Badge variant="outline" className="bg-white text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Multiple Choice</Badge>
                          </div>
                          <CardContent className="p-6 space-y-4">
                            <h4 className="font-semibold text-lg">{q.questionText}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options?.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className={`p-3 rounded-lg border text-sm ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                  {opt}
                                  {opt === q.correctAnswer && <span className="ml-2 text-[10px] font-bold uppercase">(Correct)</span>}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-1 text-amber-700">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase">AI Explanation</span>
                                </div>
                                <p className="text-xs text-amber-900 leading-relaxed italic">{q.explanation}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-4 border-t bg-white">
              <Button onClick={() => setViewingQuiz(null)}>Close Review</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showQuizCreate} onOpenChange={setShowQuizCreate}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
            <DialogHeader className="p-6 border-b bg-white shrink-0">
              <div className="flex items-center gap-2 text-primary mb-1">
                <BookText className="h-5 w-5" />
                <DialogTitle>Assign Classroom Quiz</DialogTitle>
              </div>
              <DialogDescription>Create a structured assessment for your students.</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 bg-slate-50/50">
              <div className="p-6 space-y-8">
                {/* General Information Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quiz Title</Label>
                      <Input 
                        value={quizData.title} 
                        onChange={e => setQuizData({...quizData, title: e.target.value})} 
                        placeholder="e.g. Midterm Biology" 
                        className="bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Classroom</Label>
                      <Select onValueChange={val => setQuizData({...quizData, classId: val})}>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Select class..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instructions / Description</Label>
                    <Textarea 
                      value={quizData.description} 
                      onChange={e => setQuizData({...quizData, description: e.target.value})} 
                      placeholder="Enter instructions for your students..." 
                      className="bg-slate-50/50 min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Questions ({quizData.questions.length})
                    </h4>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion} className="bg-white hover:bg-primary hover:text-white transition-all shadow-sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {quizData.questions.map((q, qIndex) => (
                      <Card key={qIndex} className="bg-white border-slate-200 shadow-sm overflow-hidden group/q">
                        <div className="px-4 py-2 bg-slate-50 border-b flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Question {qIndex + 1}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            disabled={quizData.questions.length <= 1}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <CardContent className="p-6 space-y-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">Question Text</Label>
                            <Input 
                              placeholder="Enter the question for students..." 
                              value={q.questionText} 
                              onChange={e => {
                                const qs = [...quizData.questions];
                                qs[qIndex].questionText = e.target.value;
                                setQuizData({...quizData, questions: qs});
                              }}
                              className="font-medium"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="space-y-1.5">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Option {oIndex + 1}</Label>
                                <Input 
                                  placeholder={`Enter option ${oIndex + 1}...`} 
                                  value={opt} 
                                  onChange={e => {
                                    const qs = [...quizData.questions];
                                    qs[qIndex].options[oIndex] = e.target.value;
                                    setQuizData({...quizData, questions: qs});
                                  }}
                                  className="h-9 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs font-bold text-green-600 uppercase">Correct Answer</Label>
                              <Input 
                                placeholder="Must match one option exactly..." 
                                value={q.correctAnswer} 
                                onChange={e => {
                                  const qs = [...quizData.questions];
                                  qs[qIndex].correctAnswer = e.target.value;
                                  setQuizData({...quizData, questions: qs});
                                }}
                                className="h-9 text-xs border-green-200 focus:ring-green-100"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs font-bold text-amber-600 uppercase">Explanation (Optional)</Label>
                              <Input 
                                placeholder="Briefly explain the correct answer..." 
                                value={q.explanation} 
                                onChange={e => {
                                  const qs = [...quizData.questions];
                                  qs[qIndex].explanation = e.target.value;
                                  setQuizData({...quizData, questions: qs});
                                }}
                                className="h-9 text-xs border-amber-200 focus:ring-amber-100"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t bg-white shrink-0">
              <Button 
                onClick={handleCreateQuiz} 
                disabled={isCreatingQuiz || !quizData.title || !quizData.classId}
                className="w-full md:w-auto px-12"
              >
                {isCreatingQuiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post {quizData.questions.length} Question Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
