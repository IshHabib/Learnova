
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { Users, Video, Calendar, Plus, ChevronRight, Brain, AlertCircle } from "lucide-react"

export default function TeacherDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Teacher Workspace</h1>
            <div className="flex items-center gap-2">
              <Button size="sm">
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
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs opacity-70">Across 4 classes</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Class Score</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">76.2%</div>
                <Progress value={76.2} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Lectures</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 Live</div>
                <p className="text-xs text-muted-foreground">Biology 101, Chem 202</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Quizzes to grade</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Class Performance Insights</CardTitle>
                  <CardDescription>Aggregate improvement across your student roster</CardDescription>
                </div>
                <Button variant="outline" size="sm">Details</Button>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>
            <Card className="md:col-span-3 shadow-sm border-none bg-primary/5">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Strategy Engine
                </CardTitle>
                <CardDescription>Generated based on current class metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-white shadow-sm border space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Intervention Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Section "Cell Division" shows a 15% drop in understanding compared to previous semesters.
                  </p>
                  <div className="pt-2">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Suggested Strategy:</h5>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Host a focused Q&A session
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Release interactive 3D model resources
                      </li>
                    </ul>
                  </div>
                  <Button className="w-full mt-2" variant="outline" size="sm">Apply Strategy</Button>
                </div>

                <div className="p-4 rounded-xl bg-white shadow-sm border">
                  <h4 className="text-sm font-semibold mb-2">Auto Study Grouping</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    AI has identified 4 optimal peer groups based on complementary strengths.
                  </p>
                  <Button className="w-full" size="sm">Review & Finalize Groups</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold font-headline mb-4">Upcoming Schedule</h2>
            <div className="space-y-3">
              {[
                { time: "09:00 AM", subject: "Organic Chemistry", type: "Live Session", students: 45 },
                { time: "11:30 AM", subject: "Intro to Algorithms", type: "In-Person", students: 32 },
                { time: "02:00 PM", subject: "Data Science Seminar", type: "Webinar", students: 88 },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-primary w-20">{session.time}</span>
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{session.subject}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{session.type}</span>
                        <span>•</span>
                        <span>{session.students} Students</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
