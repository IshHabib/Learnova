"use client"

import { useMemo, useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Brain, TrendingUp, Target, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { suggestTeachingStrategies } from "@/ai/flows/suggest-teaching-strategies"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function TeacherAnalyticsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const [teacherAttempts, setTeacherAttempts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // AI Strategy State
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false)
  const [aiStrategies, setAiStrategies] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  const teacherClassesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])
  const { data: teacherClasses, isLoading: classesLoading } = useCollection(teacherClassesQuery)

  useEffect(() => {
    if (!db || !user?.uid || classesLoading || !teacherClasses) {
      if (!classesLoading && teacherClasses?.length === 0) {
        setTeacherAttempts([])
        setIsLoading(false)
      }
      return
    }

    const studentIds = new Set<string>()
    teacherClasses.forEach(cls => {
      cls.studentIds?.forEach((id: string) => studentIds.add(id))
    })

    if (studentIds.size === 0) {
      setTeacherAttempts([])
      setIsLoading(false)
      return
    }

    const fetchAttempts = async () => {
      const allAttempts: any[] = []
      for (const studentId of Array.from(studentIds)) {
        try {
          const attemptsSnap = await getDocs(
            query(collection(db, "users", studentId, "quizAttempts"), where("teacherId", "==", user.uid))
          )
          attemptsSnap.forEach(doc => {
            allAttempts.push({ id: doc.id, ...doc.data() })
          })
        } catch (e) {
          console.warn(`Could not fetch attempts for student ${studentId}:`, e)
        }
      }
      setTeacherAttempts(allAttempts)
      setIsLoading(false)
    }

    fetchAttempts()
  }, [db, user?.uid, teacherClasses, classesLoading])

  const stats = useMemo(() => {
    const total = teacherAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0)
    return {
      avg: teacherAttempts.length > 0 ? Math.round(total / teacherAttempts.length) : 0,
      count: teacherAttempts.length
    }
  }, [teacherAttempts])

  const chartData = useMemo(() => {
    return [...teacherAttempts]
      .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())
      .slice(-10) 
      .map((a, i) => ({
        name: a.submissionDate ? new Date(a.submissionDate).toLocaleDateString() : `Item ${i}`,
        score: a.score || 0
      }))
  }, [teacherAttempts])

  const handleGetAIFindings = async () => {
    if (teacherAttempts.length === 0) return
    setIsGeneratingStrategies(true)
    setShowAiModal(true)
    
    try {
      const lowPerformers = teacherAttempts.filter(a => a.score < 70)
      const summary = `
        Class Performance Overview:
        - Assessments tracked: ${teacherAttempts.length}
        - Average score: ${stats.avg}%
        
        Recent Academic Weaknesses:
        ${lowPerformers.slice(0, 8).map(a => `- ${a.studentName || 'Student'}: ${a.score}% in "${a.title || 'Quiz'}"`).join('\n')}
      `
      
      const result = await suggestTeachingStrategies({
        classPerformanceAnalytics: summary
      })
      
      setAiStrategies(result.strategies)
    } catch (error) {
      console.error("AI Analysis failed:", error)
      setAiStrategies("Unable to analyze class data at this time.")
    } finally {
      setIsGeneratingStrategies(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Student Performance Analytics</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none bg-primary text-primary-foreground shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80">Aggregate Class Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? "..." : `${stats.avg}%`}</div>
                <div className="flex items-center gap-1 text-xs mt-1 opacity-70">
                  <TrendingUp className="h-3 w-3" />
                  <span>Stabilized trends</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? "..." : stats.count}</div>
                <p className="text-xs text-muted-foreground mt-1">Quizzes completed</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Learners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {teacherClasses ? teacherClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0) : "--"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique students reached</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Learning Trajectory</CardTitle>
              <CardDescription>Visualizing student improvement across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart data={chartData} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm bg-accent/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Academic Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacherAttempts.length > 0 ? (
                   <p className="text-sm text-slate-700 leading-relaxed">
                    Found {teacherAttempts.filter(a => a.score < 70).length} assessment instances with below-target scores. Review the AI suggestions for intervention strategies.
                   </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Insufficient data to identify topic weaknesses. Trends will appear as students complete more assessments.</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Suggested Interventions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {teacherAttempts.length > 0 
                      ? "AI Analysis is ready. Generate a strategy report based on your students' recent performance."
                      : "AI is currently observing student interactions. Strategy suggestions will be generated once performance patterns stabilize."
                    }
                  </p>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    size="sm" 
                    disabled={teacherAttempts.length === 0}
                    onClick={handleGetAIFindings}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    Generate Strategy Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 border-b bg-white shrink-0">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Brain className="h-6 w-6" />
                <DialogTitle className="text-xl font-headline">AI Instructional Strategy Report</DialogTitle>
              </div>
              <DialogDescription>Data-driven insights for improved learning outcomes</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto pb-12">
                {isGeneratingStrategies ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Processing analytics data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
                      {aiStrategies}
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-900 leading-relaxed italic">
                        <strong>Expert Insight:</strong> Use these AI-generated strategies to augment your classroom experience. Every point in the report is calculated based on recent assessment history.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="p-4 border-t bg-white shrink-0">
              <Button onClick={() => setShowAiModal(false)}>Dismiss Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
