"use client"

import { useMemo } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { collectionGroup, query, where, orderBy } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Award, Target, Activity } from "lucide-react"

export default function StudentAnalyticsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    // Collection Group query for all attempts by this student
    return query(
      collectionGroup(db, "quizAttempts"), 
      where("studentId", "==", user.uid),
      orderBy("submissionDate", "asc")
    )
  }, [db, user?.uid])

  const { data: attempts, isLoading } = useCollection(attemptsQuery)

  const chartData = useMemo(() => {
    return (attempts || []).map((attempt, index) => ({
      name: attempt.submissionDate ? format(new Date(attempt.submissionDate), "MMM d") : `Quiz ${index + 1}`,
      score: attempt.score || 0,
    }))
  }, [attempts])

  const stats = useMemo(() => {
    const data = attempts || []
    const avg = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length) : 0
    const high = data.length > 0 ? Math.max(...data.map(d => d.score || 0)) : 0
    return { avg, high, count: data.length }
  }, [attempts])

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Performance Analytics</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none bg-primary text-primary-foreground shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Average Proficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? "..." : `${stats.avg}%`}</div>
                <p className="text-xs opacity-70 mt-1">Based on {stats.count} assessments</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  Highest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? "..." : `${stats.high}%`}</div>
                <p className="text-xs text-muted-foreground mt-1">Personal best record</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Learning Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.count > 0 ? "High" : "--"}</div>
                <p className="text-xs text-muted-foreground mt-1">Retention stability</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Progress Trajectory</CardTitle>
              <CardDescription>Your performance trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart data={chartData} />
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}