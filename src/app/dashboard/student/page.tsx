"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { BookOpen, Video, Brain, PlayCircle, FileText, ArrowRight, TrendingUp } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    averageGrade: 0,
    classesAttended: 0,
    quizzesCompleted: 0,
    newMessages: 0
  })

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            if (data.stats) {
              setStats({
                averageGrade: data.stats.averageGrade || 0,
                classesAttended: data.stats.classesAttended || 0,
                quizzesCompleted: data.stats.quizzesCompleted || 0,
                newMessages: data.stats.newMessages || 0
              })
            }
          }
        })
        return () => unsubscribeDoc()
      }
    })
    return () => unsubscribeAuth()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Student Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="hidden sm:flex">
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
                <div className="text-2xl font-bold">{stats.averageGrade}%</div>
                <p className="text-xs opacity-70">Updated in real-time</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.classesAttended}</div>
                <p className="text-xs text-muted-foreground">This semester</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.quizzesCompleted}</div>
                <Progress value={(stats.quizzesCompleted / 15) * 100} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newMessages} New</div>
                <p className="text-xs text-muted-foreground">Check your inbox</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 shadow-sm border-none">
              <CardHeader>
                <CardTitle className="font-headline">Performance Trend</CardTitle>
                <CardDescription>Your progress across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>
            <Card className="md:col-span-3 shadow-sm border-none">
              <CardHeader>
                <CardTitle className="font-headline">AI Recommended Actions</CardTitle>
                <CardDescription>Tailored for your improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-start gap-3">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Review: Calculus III</h4>
                    <p className="text-xs text-muted-foreground">Based on your last quiz, you should focus on partial derivatives.</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-primary">Start Review</Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-start gap-3">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Watch: Neural Networks</h4>
                    <p className="text-xs text-muted-foreground">Suggested for extra credit in CS101.</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-primary">Open Video</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-headline">Continue Learning</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Introduction to Psychology", teacher: "Dr. Emily Brown", progress: 65, type: "notes" },
                { title: "Advanced Quantum Mechanics", teacher: "Prof. Niels Bohr", progress: 30, type: "video" },
                { title: "Global Macroeconomics", teacher: "Dr. Janet Yellen", progress: 85, type: "quiz" },
              ].map((item, i) => (
                <Card key={i} className="shadow-sm border-none overflow-hidden group">
                  <div className="h-32 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {item.type === "video" ? <PlayCircle className="h-10 w-10 text-primary opacity-50" /> : <FileText className="h-10 w-10 text-primary opacity-50" />}
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-headline">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.teacher}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{item.progress}% Complete</span>
                    </div>
                    <Progress value={item.progress} className="h-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
