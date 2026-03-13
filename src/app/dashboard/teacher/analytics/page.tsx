
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { collectionGroup, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Brain, TrendingUp, Users, Target } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherAnalyticsPage() {
  const { user } = useUser()
  const db = useFirestore()

  // Fetch all quiz attempts across all classes managed by this teacher
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collectionGroup(db, "quizAttempts"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: attempts, isLoading } = useCollection(attemptsQuery)

  const stats = useMemoFirebase(() => {
    if (!attempts) return { avg: 0, count: 0 }
    const total = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0)
    return {
      avg: attempts.length > 0 ? Math.round(total / attempts.length) : 0,
      count: attempts.length
    }
  }, [attempts])

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
            <Card className="border-none bg-primary text-primary-foreground">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">--</div>
                <p className="text-xs text-muted-foreground mt-1">Unique learners reached</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Learning Trajectory</CardTitle>
              <CardDescription>Visualizing student improvement across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm bg-accent/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Weak Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">Insufficient data to identify topic weaknesses. Trends will appear as students complete more assessments.</p>
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
                <p className="text-sm text-muted-foreground italic">AI is currently observing student interactions. Strategy suggestions will be generated once performance patterns stabilize.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
