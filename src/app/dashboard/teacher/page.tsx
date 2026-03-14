"use client"

import { useMemo, useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { Users, Video, Calendar, Plus, ChevronRight, Brain, AlertCircle, Sparkles, Loader2 } from "lucide-react"
import { doc, collection, query, where, getDocs } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { suggestTeachingStrategies } from "@/ai/flows/suggest-teaching-strategies"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TeacherDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  
  const [teacherAttempts, setTeacherAttempts] = useState<any[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)

  // AI Strategy State
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false)
  const [aiStrategies, setAiStrategies] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  // 1. Fetch User Profile
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef)

  // 2. Fetch Teacher's Classes
  const teacherClassesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])
  const { data: teacherClasses, isLoading: classesLoading } = useCollection(teacherClassesQuery)

  // 3. Fetch Student Quiz Attempts
  useEffect(() => {
    if (!db || !user?.uid || classesLoading || !teacherClasses) {
      if (!classesLoading && teacherClasses?.length === 0) {
        setTeacherAttempts([])
        setAttemptsLoading(false)
      }
      return
    }

    const studentIds = new Set<string>()
    teacherClasses.forEach(cls => {
      if (cls.studentIds && Array.isArray(cls.studentIds)) {
        cls.studentIds.forEach((id: string) => studentIds.add(id))
      }
    })

    if (studentIds.size === 0) {
      setTeacherAttempts([])
      setAttemptsLoading(false)
      return
    }

    const fetchAttempts = async () => {
      try {
        const allAttempts: any[] = []
        for (const studentId of Array.from(studentIds)) {
          try {
            const attemptsSnap = await getDocs(
              query(collection(db, "users", studentId, "quizAttempts"), where("teacherId", "==", user.uid))
            )
            attemptsSnap.forEach(doc => {
              allAttempts.push({ id: doc.id, ...doc.data() })
            })
          } catch (err) {
            console.warn(`Could not access records for student ${studentId}:`, err)
          }
        }
        setTeacherAttempts(allAttempts)
      } catch (error) {
        console.error("Critical error in fetchAttempts loop:", error)
      } finally {
        setAttemptsLoading(false)
      }
    }

    fetchAttempts()
  }, [db, user?.uid, teacherClasses, classesLoading])

  const stats = useMemo(() => {
    const classes = teacherClasses || []
    const attempts = teacherAttempts || []
    
    const studentSet = new Set<string>()
    classes.forEach(c => {
      if (c.studentIds && Array.isArray(c.studentIds)) {
        c.studentIds.forEach((id: string) => studentSet.add(id))
      }
    })
    
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length)
      : 0

    return {
      totalStudents: studentSet.size,
      avgClassScore: avgScore,
      activeLectures: 0, 
      resultsTracked: attempts.length 
    }
  }, [teacherClasses, teacherAttempts])

  const handleGetAIFindings = async () => {
    if (teacherAttempts.length === 0) return
    setIsGeneratingStrategies(true)
    setShowAiModal(true)
    
    try {
      // Aggregate data for AI
      const lowPerformers = teacherAttempts.filter(a => a.score < 70)
      const summary = `
        Class Performance Overview:
        - Total students: ${stats.totalStudents}
        - Total assessments completed: ${teacherAttempts.length}
        - Average score: ${stats.avgClassScore}%
        
        Recent Low Performances (<70%):
        ${lowPerformers.slice(0, 5).map(a => `- ${a.studentName || 'Student'}: ${a.score}% in "${a.title || 'Quiz'}"`).join('\n')}
      `
      
      const result = await suggestTeachingStrategies({
        classPerformanceAnalytics: summary
      })
      
      setAiStrategies(result.strategies)
    } catch (error) {
      console.error("AI Analysis failed:", error)
      setAiStrategies("I'm sorry, I was unable to analyze the data at this time. Please try again later.")
    } finally {
      setIsGeneratingStrategies(false)
    }
  }

  const isLoading = userLoading || classesLoading || attemptsLoading

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline text-foreground">Teacher Workspace</h1>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => window.location.href = "/dashboard/teacher/classes"}>
                <Plus className="mr-2 h-4 w-4" />
                New Class
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-none bg-accent text-accent-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                <Users className="h-4 w-4 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalStudents}</div>
                <p className="text-xs opacity-70">Enrolled in your classes</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Proficiency</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : `${stats.avgClassScore}%`}</div>
                <Progress value={stats.avgClassScore} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Lectures</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : `${stats.activeLectures} Live`}</div>
                <p className="text-xs text-muted-foreground">Happening now</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Results Tracked</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.resultsTracked}</div>
                <p className="text-xs text-muted-foreground">Total attempts logged</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-foreground">Performance Insights</CardTitle>
                  <CardDescription>Improvement trends across all students</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/teacher/analytics"}>Details</Button>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={teacherAttempts.map((a, i) => ({ name: `Entry ${i + 1}`, score: a.score }))} />
              </CardContent>
            </Card>
            <Card className="md:col-span-3 shadow-sm border-none bg-primary/5">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-foreground">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Strategy Engine
                </CardTitle>
                <CardDescription>Personalized instructional suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherClasses?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white shadow-sm border text-center">
                    <p className="text-sm text-muted-foreground">Create your first class to unlock AI strategies!</p>
                    <Button className="mt-4 w-full" variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/teacher/classes"}>Create Class</Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white shadow-sm border space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Insights Available</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {teacherAttempts.length > 0 
                        ? "AI has analyzed your student data. Actionable strategies are ready for your review."
                        : "AI is ready to analyze your classes. Insights will appear once students complete assessments."
                      }
                    </p>
                    <Button 
                      className="w-full mt-2" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGetAIFindings}
                      disabled={teacherAttempts.length === 0}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      View Initial Findings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-headline text-foreground">Your Classes</h2>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/dashboard/teacher/classes"}>View All</Button>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)
              ) : teacherClasses?.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No classes managed yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/dashboard/teacher/classes"}>Set Up Class</Button>
                </div>
              ) : (
                teacherClasses?.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => window.location.href = `/dashboard/teacher/classes`}>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-bold text-primary w-24">{session.subject}</span>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors text-foreground">{session.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{session.studentIds?.length || 0} Students enrolled</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 border-b bg-white shrink-0">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Brain className="h-6 w-6" />
                <DialogTitle className="text-xl font-headline">AI Instructional Strategy Report</DialogTitle>
              </div>
              <DialogDescription>Performance-based findings and suggested interventions</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-2xl mx-auto pb-12">
                {isGeneratingStrategies ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Analyzing student performance data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
                      {aiStrategies}
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        <strong>Teacher's Note:</strong> These strategies are generated by AI based on classroom trends. Use your pedagogical expertise to adapt these recommendations to your specific classroom environment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="p-4 border-t bg-white shrink-0">
              <Button onClick={() => setShowAiModal(false)}>Close Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
