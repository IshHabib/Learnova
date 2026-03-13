
"use client"

import { useMemo } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { Users, Video, Calendar, Plus, ChevronRight, Brain, AlertCircle } from "lucide-react"
import { doc, collection, query, where, collectionGroup } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"

export default function TeacherDashboard() {
  const { user } = useUser()
  const db = useFirestore()

  // 1. Fetch User Profile
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef)

  // 2. Fetch Teacher's Classes
  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])
  const { data: teacherClasses, isLoading: classesLoading } = useCollection(classesQuery)

  // 3. Fetch All Quiz Attempts for this Teacher's classes
  // Note: This uses a collectionGroup query as supported by security rules and backend.json denormalization
  const teacherAttemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collectionGroup(db, "quizAttempts"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])
  const { data: teacherAttempts, isLoading: attemptsLoading } = useCollection(teacherAttemptsQuery)

  // Calculate Real-time Stats
  const stats = useMemo(() => {
    const classes = teacherClasses || []
    const attempts = teacherAttempts || []
    
    const totalStudents = classes.reduce((acc, curr) => acc + (curr.studentIds?.length || 0), 0)
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length)
      : 0

    return {
      totalStudents,
      avgClassScore: avgScore,
      activeLectures: 0, // Placeholder until live session logic is implemented
      pendingTasks: attempts.length // For MVP, attempts to review
    }
  }, [teacherClasses, teacherAttempts])

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
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalStudents}</div>
                <p className="text-xs opacity-70">Across your classes</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Class Score</CardTitle>
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
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">Items to grade/review</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-foreground">Class Performance Insights</CardTitle>
                  <CardDescription>Aggregate improvement across your student roster</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/teacher/analytics"}>Details</Button>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>
            <Card className="md:col-span-3 shadow-sm border-none bg-primary/5">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-foreground">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Strategy Engine
                </CardTitle>
                <CardDescription>Generated based on current class metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherClasses?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white shadow-sm border text-center">
                    <p className="text-sm text-muted-foreground">Create your first class to unlock AI strategies!</p>
                    <Button className="mt-4 w-full" variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/teacher/classes"}>Create Class</Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white shadow-sm border space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Analytics Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI is monitoring student progress. Insights will appear as students complete assessments.
                    </p>
                    <Button className="w-full mt-2" variant="outline" size="sm">Request Strategy Report</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold font-headline mb-4 text-foreground">Your Classes</h2>
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
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => window.location.href = `/dashboard/teacher/classes/${session.id}`}>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-bold text-primary w-20">{session.subject}</span>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors text-foreground">{session.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{session.studentIds?.length || 0} Students</span>
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
      </SidebarInset>
    </SidebarProvider>
  )
}
