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

  // State for Active Quiz (Session)
  const [activeQuiz, setActiveQuiz] = useState<GeneratePracticeQuizOutput | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Fetch History - Direct subcollection query
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
      
      // Save full attempt data for later review
      await setDoc(attemptRef, {
        id: attemptId,
        studentId: user.uid,
        teacherId: "self-study", // Denormalized for collectionGroup provably safe queries
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
    if (!attempt.questions || attempt.questions.length === 0) {
      toast({ title: "Cannot load review", description: "This attempt doesn't contain question data.", variant: "destructive" })
      return
    }

    setActiveQuiz({
      quizTitle: attempt.title || "Practice Quiz",
      questions: attempt.questions
    })
    setSelectedAnswers(attempt.userAnswers || {})
    setFinalScore(attempt.score || 0)
    setShowReview(true)
  }

  const progress = activeQuiz ? ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100 : 0

  if (showReview && activeQuiz) {
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold font-headline">Results: {activeQuiz.quizTitle}</h1>
          </header>
          <main className="p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-8 pb-12">
              <Card className="bg-primary text-primary-foreground border-none shadow-xl">
                <CardContent className="pt-8 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <div className="space-y-1 mb-6">
                    <h2 className="text-4xl font-extrabold">{finalScore}%</h2>
                    <p className="text-sm opacity-90 font-medium">Performance Score</p>
                  </div>
                  <Button variant="secondary" onClick={() => {
                    setActiveQuiz(null)
                    setShowReview(false)
                  }}>
                    Back to All Quizzes
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl font-headline">Detailed Review</h3>
                </div>
                
                <div className="grid gap-6">
                  {activeQuiz.questions.map((q, idx) => {
                    const isCorrect = selectedAnswers[idx] === q.correctAnswer
                    return (
                      <Card key={idx} className={`border-none shadow-sm overflow-hidden border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardHeader className="bg-slate-50/50 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Question {idx + 1}</span>
                              <p className="font-semibold text-foreground leading-relaxed">{q.questionText}</p>
                            </div>
                            {isCorrect ? (
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <XCircle className="h-5 w-5 text-red-600" />
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                              <span className="font-bold block text-[10px] uppercase text-muted-foreground mb-1">Your Selection</span>
                              <p className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                {selectedAnswers[idx] || "No answer provided"}
                              </p>
                            </div>
                            {!isCorrect && (
                              <div className="p-4 rounded-xl border-2 bg-green-50 border-green-100">
                                <span className="font-bold block text-[10px] uppercase text-muted-foreground mb-1">Correct Answer</span>
                                <p className="text-sm font-medium text-green-800">{q.correctAnswer}</p>
                              </div>
                            )}
                          </div>
                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <span className="font-bold text-[10px] uppercase text-primary block mb-2">Explanation</span>
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              {q.explanation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex]
    return (
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarInset>
          <div className="flex flex-col h-full bg-slate-50/50">
            <header className="h-16 border-b bg-white flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}>Exit Quiz</Button>
                <div className="h-4 w-px bg-slate-200" />
                <h2 className="font-semibold text-sm truncate max-w-[200px]">{activeQuiz.quizTitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
              </div>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center overflow-auto">
              <div className="w-full max-w-2xl pt-4">
                <Progress value={progress} className="mb-10 h-2 bg-slate-200" />
                
                <Card className="border-none shadow-xl bg-white mb-20">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl leading-relaxed text-slate-800 font-headline">
                      {currentQ.questionText}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <RadioGroup 
                      value={selectedAnswers[currentQuestionIndex]} 
                      onValueChange={(val) => setSelectedAnswers(prev => ({...prev, [currentQuestionIndex]: val}))}
                      className="space-y-3"
                    >
                      {currentQ.options?.map((opt, i) => (
                        <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer group ${selectedAnswers[currentQuestionIndex] === opt ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}>
                          <RadioGroupItem value={opt} id={`q-${i}`} className="text-primary border-slate-300" />
                          <Label htmlFor={`q-${i}`} className="flex-1 cursor-pointer font-medium text-slate-700 group-hover:text-slate-900">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                    <Button variant="ghost" onClick={handleBack} disabled={currentQuestionIndex === 0}>Back</Button>
                    {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                      <Button onClick={handleSubmit} disabled={isSubmitting || !selectedAnswers[currentQuestionIndex]} className="px-8 shadow-md">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestionIndex]} className="px-8">
                        Next Question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
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
                    What topic would you like to be tested on? AI will generate a set of questions for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Quiz Topic</Label>
                    <Input 
                      id="topic" 
                      placeholder="e.g. World War II, React Hooks, Biology basics..." 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {isGenerating ? "Generating Questions..." : "Generate & Start"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Learning History</h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : !attempts || attempts.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary opacity-40" />
                </div>
                <h3 className="font-semibold text-slate-700">No assessments yet</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-2">Generate your first AI practice quiz to start measuring your proficiency.</p>
                <Button variant="outline" className="mt-6" onClick={() => setShowGenDialog(true)}>Create First Quiz</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {attempts.map((attempt) => (
                  <div 
                    key={attempt.id} 
                    className="group flex items-center justify-between p-5 rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleViewPastAttempt(attempt)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${attempt.score >= 70 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {attempt.score >= 70 ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-primary transition-colors">{attempt.title || "Practice Quiz"}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Timer className="h-3 w-3" />
                          {attempt.submissionDate ? format(new Date(attempt.submissionDate), "MMM d, yyyy • h:mm a") : "Unknown Date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <span className="text-2xl font-black font-headline text-slate-800">{attempt.score}%</span>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Score</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
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