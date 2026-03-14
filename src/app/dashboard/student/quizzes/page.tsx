
"use client"

import { useState, useMemo, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Brain, 
  Loader2, 
  ChevronRight, 
  Timer, 
  Trophy,
  XCircle,
  Info,
  BookText
} from "lucide-react"
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { generatePracticeQuiz, GeneratePracticeQuizOutput } from "@/ai/flows/generate-practice-quiz"
import { useToast } from "@/hooks/use-toast"

export default function StudentQuizzesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // State for Quiz Generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState("")
  const [showGenDialog, setShowGenDialog] = useState(false)

  // State for Class Quizzes
  const [classQuizzes, setClassQuizzes] = useState<any[]>([])
  const [classQuizzesLoading, setClassQuizzesLoading] = useState(true)

  // State for Active Quiz (Session)
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Fetch History
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return collection(db, "users", user.uid, "quizAttempts")
  }, [db, user?.uid])

  const { data: unsortedAttempts, isLoading: attemptsLoading } = useCollection(attemptsQuery)

  const attempts = useMemo(() => {
    if (!unsortedAttempts) return []
    return [...unsortedAttempts].sort((a, b) => {
      const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0
      const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0
      return dateB - dateA
    })
  }, [unsortedAttempts])

  // Fetch Class Quizzes
  useEffect(() => {
    if (!db || !user?.uid) return

    const fetchClassQuizzes = async () => {
      try {
        const classesQuery = query(collection(db, "classes"), where("studentIds", "array-contains", user.uid))
        const classSnaps = await getDocs(classesQuery)
        const allQuizzes: any[] = []

        for (const classDoc of classSnaps.docs) {
          const quizzesSnap = await getDocs(collection(db, "classes", classDoc.id, "quizzes"))
          quizzesSnap.forEach(q => {
            allQuizzes.push({ id: q.id, ...q.data(), className: classDoc.data().name })
          })
        }
        setClassQuizzes(allQuizzes)
      } catch (err) {
        console.warn("Could not fetch classroom quizzes")
      } finally {
        setClassQuizzesLoading(false)
      }
    }

    fetchClassQuizzes()
  }, [db, user?.uid])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    try {
      const result = await generatePracticeQuiz({ 
        topic, 
        numQuestions: 5,
        questionType: 'multiple_choice' 
      })
      setActiveQuiz({
        id: "ai_generated",
        title: result.quizTitle,
        questions: result.questions,
        type: 'ai',
        teacherId: "self-study"
      })
      setShowGenDialog(false)
      setCurrentQuestionIndex(0)
      setSelectedAnswers({})
      setShowReview(false)
    } catch (error: any) {
      toast({ title: "Generation Failed", description: "Could not create quiz.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const startClassQuiz = (quiz: any) => {
    setActiveQuiz({
      ...quiz,
      type: 'class'
    })
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowReview(false)
  }

  const handleNext = () => {
    if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!activeQuiz || !user) return
    setIsSubmitting(true)
    
    let correctCount = 0
    activeQuiz.questions.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++
      }
    })

    const calculatedScore = Math.round((correctCount / activeQuiz.questions.length) * 100)
    const attemptRef = doc(collection(db, "users", user.uid, "quizAttempts"))

    try {
      await setDoc(attemptRef, {
        id: attemptRef.id,
        studentId: user.uid,
        studentName: user.displayName || "Learner",
        teacherId: activeQuiz.teacherId || activeQuiz.classTeacherId || "self-study",
        classTeacherId: activeQuiz.classTeacherId || "self-study",
        quizId: activeQuiz.id,
        classId: activeQuiz.classId || "self-study",
        score: calculatedScore,
        submissionDate: new Date().toISOString(),
        feedback: `You got ${correctCount} out of ${activeQuiz.questions.length} correct.`,
        title: activeQuiz.title || activeQuiz.quizTitle,
        questions: activeQuiz.questions,
        userAnswers: selectedAnswers
      })
      
      setFinalScore(calculatedScore)
      setShowReview(true)
      toast({ title: "Quiz Submitted!", description: `Your score: ${calculatedScore}%` })
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewPastAttempt = (attempt: any) => {
    if (!attempt.questions) return
    setActiveQuiz({
      title: attempt.title || "Practice Quiz",
      questions: attempt.questions,
      type: 'history'
    })
    setSelectedAnswers(attempt.userAnswers || {})
    setFinalScore(attempt.score || 0)
    setShowReview(true)
  }

  if (showReview && activeQuiz) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold font-headline">Results</h1>
          </header>
          <main className="p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-8 pb-12">
              <Card className="bg-primary text-primary-foreground border-none shadow-xl text-center p-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-80" />
                <h2 className="text-4xl font-extrabold mb-2">{finalScore}%</h2>
                <Button variant="secondary" onClick={() => { setActiveQuiz(null); setShowReview(false); }}>Back to Quizzes</Button>
              </Card>

              <div className="space-y-6">
                {activeQuiz.questions.map((q: any, idx: number) => {
                  const isCorrect = selectedAnswers[idx] === q.correctAnswer
                  return (
                    <Card key={idx} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Question {idx + 1}: {q.questionText}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <span className="text-[10px] font-bold uppercase block mb-1">Your Answer</span>
                            <p className="text-sm">{selectedAnswers[idx] || "None"}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-green-50">
                            <span className="text-[10px] font-bold uppercase block mb-1">Correct Answer</span>
                            <p className="text-sm">{q.correctAnswer}</p>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="p-4 bg-muted rounded-xl text-xs italic">
                            {q.explanation}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="flex flex-col h-full bg-slate-50/50">
            <header className="h-16 border-b bg-white flex items-center justify-between px-6">
              <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}>Exit</Button>
              <h2 className="font-semibold text-sm">{activeQuiz.title || activeQuiz.quizTitle}</h2>
              <span className="text-xs font-medium">Q{currentQuestionIndex + 1}/{activeQuiz.questions.length}</span>
            </header>
            <main className="flex-1 p-6 flex flex-col items-center overflow-auto">
              <div className="w-full max-w-2xl">
                <Progress value={progress} className="mb-8" />
                <Card>
                  <CardHeader><CardTitle className="text-xl">{currentQ?.questionText}</CardTitle></CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedAnswers[currentQuestionIndex]} 
                      onValueChange={(val) => setSelectedAnswers(prev => ({...prev, [currentQuestionIndex]: val}))}
                      className="space-y-3"
                    >
                      {currentQ?.options?.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={opt} id={`opt-${i}`} />
                          <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="justify-between border-t p-6">
                    <Button variant="ghost" onClick={handleBack} disabled={currentQuestionIndex === 0}>Back</Button>
                    <Button onClick={currentQuestionIndex === activeQuiz.questions.length - 1 ? handleSubmit : handleNext} disabled={!selectedAnswers[currentQuestionIndex]}>
                      {currentQuestionIndex === activeQuiz.questions.length - 1 ? "Submit" : "Next"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </main>
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
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Assessments</h1>
            <Button size="sm" onClick={() => setShowGenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              AI Practice Quiz
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Tabs defaultValue="assigned" className="space-y-8">
            <TabsList>
              <TabsTrigger value="assigned">Assigned Quizzes</TabsTrigger>
              <TabsTrigger value="history">My History</TabsTrigger>
            </TabsList>

            <TabsContent value="assigned">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classQuizzesLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
                ) : classQuizzes.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">No classroom quizzes assigned yet.</p>
                  </div>
                ) : (
                  classQuizzes.map(quiz => (
                    <Card key={quiz.id} className="border-none shadow-sm hover:ring-2 ring-primary/20 transition-all">
                      <CardHeader className="pb-3">
                        <BookText className="h-5 w-5 text-accent mb-2" />
                        <CardTitle className="text-sm font-bold">{quiz.title}</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">{quiz.className}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full text-xs" size="sm" onClick={() => startClassQuiz(quiz)}>Start Quiz</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="grid gap-3">
                {attemptsLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
                ) : attempts.length === 0 ? (
                  <div className="py-12 text-center italic text-muted-foreground">No attempt history found.</div>
                ) : (
                  attempts.map(attempt => (
                    <Card key={attempt.id} className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleViewPastAttempt(attempt)}>
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${attempt.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {attempt.score}%
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{attempt.title || "Practice Quiz"}</h4>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(attempt.submissionDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>AI Practice Quiz</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <Label>What topic should we test?</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. World History" />
            </div>
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
                {isGenerating ? "Generating..." : "Generate & Start"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
