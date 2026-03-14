"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  Info
} from "lucide-react"
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore"
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

  // State for Active Quiz
  const [activeQuiz, setActiveQuiz] = useState<GeneratePracticeQuizOutput | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Fetch History
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "users", user.uid, "quizAttempts"),
      orderBy("submissionDate", "desc")
    )
  }, [db, user?.uid])

  const { data: attempts, isLoading } = useCollection(attemptsQuery)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    try {
      const result = await generatePracticeQuiz({ 
        topic, 
        numQuestions: 5,
        questionType: 'multiple_choice' 
      })
      setActiveQuiz(result)
      setShowGenDialog(false)
      setCurrentQuestionIndex(0)
      setSelectedAnswers({})
      setShowReview(false)
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: "Could not create quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
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
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++
      }
    })

    const calculatedScore = Math.round((correctCount / activeQuiz.questions.length) * 100)
    const attemptId = `attempt_${Date.now()}`

    try {
      const attemptRef = doc(db, "users", user.uid, "quizAttempts", attemptId)
      // We save the questions and selected answers so we can re-view them later
      await setDoc(attemptRef, {
        id: attemptId,
        studentId: user.uid,
        quizId: "ai_generated",
        score: calculatedScore,
        submissionDate: new Date().toISOString(),
        feedback: `You got ${correctCount} out of ${activeQuiz.questions.length} correct.`,
        title: activeQuiz.quizTitle,
        questions: activeQuiz.questions,
        userAnswers: selectedAnswers
      })
      
      setFinalScore(calculatedScore)
      setShowReview(true)
      
      toast({ 
        title: "Quiz Submitted!", 
        description: `Your score: ${calculatedScore}%`,
      })
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewPastAttempt = (attempt: any) => {
    // Reconstruct the quiz state from the saved attempt
    setActiveQuiz({
      quizTitle: attempt.title || "Practice Quiz",
      questions: attempt.questions || []
    })
    setSelectedAnswers(attempt.userAnswers || {})
    setFinalScore(attempt.score || 0)
    setShowReview(true)
  }

  const progress = activeQuiz ? ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100 : 0

  // Review Screen
  if (showReview && activeQuiz) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold font-headline">Results: {activeQuiz.quizTitle}</h1>
          </header>
          <main className="p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-80" />
                  <h2 className="text-3xl font-bold mb-1">{finalScore}%</h2>
                  <p className="opacity-90">Review your performance below.</p>
                  <Button variant="secondary" className="mt-4" onClick={() => {
                    setActiveQuiz(null)
                    setShowReview(false)
                  }}>
                    Back to Quizzes
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Detailed Review
                </h3>
                {activeQuiz.questions.map((q, idx) => {
                  const isCorrect = selectedAnswers[idx] === q.correctAnswer
                  return (
                    <Card key={idx} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-medium">{idx + 1}. {q.questionText}</p>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className={`p-2 rounded ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <span className="font-bold block text-xs uppercase opacity-60">Your Answer</span>
                            {selectedAnswers[idx] || "No answer provided"}
                          </div>
                          {!isCorrect && (
                            <div className="p-2 rounded bg-green-50">
                              <span className="font-bold block text-xs uppercase opacity-60">Correct Answer</span>
                              {q.correctAnswer}
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm italic text-muted-foreground border">
                          <span className="font-bold text-xs uppercase block not-italic mb-1">Explanation</span>
                          {q.explanation}
                        </div>
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

  // Active Quiz Screen
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex]
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="flex flex-col h-full bg-slate-50/50">
            <header className="h-16 border-b bg-white flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}>Exit</Button>
                <div className="h-4 w-px bg-slate-200" />
                <h2 className="font-semibold text-sm">{activeQuiz.quizTitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
              </div>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <Progress value={progress} className="mb-8 h-2" />
                
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg leading-relaxed">
                      {currentQ.questionText}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedAnswers[currentQuestionIndex]} 
                      onValueChange={(val) => setSelectedAnswers(prev => ({...prev, [currentQuestionIndex]: val}))}
                      className="space-y-3"
                    >
                      {currentQ.options?.map((opt, i) => (
                        <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAnswers[currentQuestionIndex] === opt ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}>
                          <RadioGroupItem value={opt} id={`q-${i}`} />
                          <Label htmlFor={`q-${i}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6">
                    <Button variant="ghost" onClick={handleBack} disabled={currentQuestionIndex === 0}>Previous</Button>
                    {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                      <Button onClick={handleSubmit} disabled={isSubmitting || !selectedAnswers[currentQuestionIndex]}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestionIndex]}>Next Question</Button>
                    )}
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
            <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New AI Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Practice Quiz</DialogTitle>
                  <DialogDescription>
                    What topic would you like to be tested on?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input 
                      id="topic" 
                      placeholder="e.g. Quantum Physics, History of Rome..." 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Quiz History</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : !attempts || attempts.length === 0 ? (
              <div className="p-12 text-center border rounded-xl bg-card">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">You haven't completed any quizzes yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div 
                    key={attempt.id} 
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:border-primary/20 transition-all cursor-pointer"
                    onClick={() => handleViewPastAttempt(attempt)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${attempt.score >= 70 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {attempt.score >= 70 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{attempt.title || "Practice Quiz"}</h4>
                        <p className="text-xs text-muted-foreground">{attempt.submissionDate ? format(new Date(attempt.submissionDate), "PPP p") : "Unknown Date"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <span className="text-xl font-bold font-headline">{attempt.score}%</span>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">Score</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
