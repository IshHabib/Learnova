"use client"

import { useMemo } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { BookOpen, Brain, FileText, ArrowRight, TrendingUp } from "lucide-react"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { format } from "date-fns"

export default function StudentDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  
  // 1. Fetch User Profile
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef)

  // 2. Fetch User's Classes
  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "classes"), 
      where("studentIds", "array-contains", user.uid)
    )
  }, [db, user?.uid])
  const { data: userClasses, isLoading: classesLoading } = useCollection(classesQuery)

  // 3. Fetch User's Quiz Attempts
  const quizAttemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "users", user.uid, "quizAttempts"),
      where("studentId", "==", user.uid), // Required by security rules filter-matching
      orderBy("submissionDate", "asc")
    )
  }, [db, user?.uid])
  const { data: quizAttempts, isLoading: attemptsLoading } = useCollection(quizAttemptsQuery)

  // Calculate Real-time Stats
  const stats = useMemo(() => {
    const attempts = quizAttempts || []
    const classes = userClasses || []
    
    const avgGrade = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length)
      : 0

    return {
      averageGrade: avgGrade,
      classesAttended: classes.length,
      quizzesCompleted: attempts.length,
      newMessages: 0 
    }
  }, [quizAttempts, userClasses])

  // Prepare Chart Data
  const chartData = useMemo(() => {
    return (quizAttempts || []).map((attempt, index) => ({
      name: attempt.submissionDate ? format(new Date(attempt.submissionDate), "MMM d") : `Quiz ${index + 1}`,
      score: attempt.score || 0,
    }))
  }, [quizAttempts])

  const isLoading = userLoading || classesLoading || attemptsLoading

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline text-foreground">Student Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.location.href = "/dashboard/student/ai-assistant"}>
                <Brain className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-none bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : `${stats.averageGrade}%`}</div>
                <p className="text-xs opacity-70">Updated in real-time</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.classesAttended}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.quizzesCompleted}</div>
                <Progress value={Math.min((stats.quizzesCompleted / 10) * 100, 100)} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : `${stats.newMessages} New`}</div>
                <p className="text-xs text-muted-foreground">Check your inbox</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 shadow-sm border-none">
              <CardHeader>
                <CardTitle className="font-headline text-foreground">Performance Trend</CardTitle>
                <CardDescription>Your progress across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={chartData} />
              </CardContent>
            </Card>
            <Card className="md:col-span-3 shadow-sm border-none">
              <CardHeader>
                <CardTitle className="font-headline text-foreground">AI Recommended Actions</CardTitle>
                <CardDescription>Tailored for your improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.quizzesCompleted === 0 ? (
                  <div className="p-4 rounded-lg bg-secondary/30 text-center">
                    <p className="text-sm text-muted-foreground">Take your first quiz to get personalized AI recommendations!</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = "/dashboard/student/quizzes"}>Go to Quizzes</Button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Review: Recent Topics</h4>
                        <p className="text-xs text-muted-foreground">Based on your last performance, you should focus on your weakest area.</p>
                        <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-primary">Start Review</Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-headline text-foreground">My Classrooms</h2>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/dashboard/student/classes"}>View All</Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />)
              ) : userClasses?.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">You haven't joined any classes yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/dashboard/student/classes"}>Explore Classes</Button>
                </div>
              ) : (
                userClasses?.map((item, i) => (
                  <Card key={i} className="shadow-sm border-none overflow-hidden group cursor-pointer" onClick={() => window.location.href = `/dashboard/student/classes`}>
                    <div className="h-32 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-10 w-10 text-primary opacity-50" />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-headline text-foreground">{item.name}</CardTitle>
                      <CardDescription className="text-xs">{item.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">Active</span>
                      </div>
                      <Progress value={100} className="h-1" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
