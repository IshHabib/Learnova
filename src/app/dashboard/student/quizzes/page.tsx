
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { collectionGroup, query, where, orderBy } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentQuizzesPage() {
  const { user } = useUser()
  const db = useFirestore()

  // Fetch all quizzes where the student is a member of the class
  // For MVP, we'll fetch attempts to show historical data
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collectionGroup(db, "quizAttempts"), 
      where("studentId", "==", user.uid),
      orderBy("submissionDate", "desc")
    )
  }, [db, user?.uid])

  const { data: attempts, isLoading } = useCollection(attemptsQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Assessments</h1>
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
                  <div key={attempt.id} className="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${attempt.score >= 70 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                        {attempt.score >= 70 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Quiz Result</h4>
                        <p className="text-xs text-muted-foreground">Submitted on {attempt.submissionDate ? format(new Date(attempt.submissionDate), "PPP") : "Unknown Date"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-headline">{attempt.score}%</span>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Final Score</p>
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
