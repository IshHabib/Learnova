
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, BookOpen, Search, Plus } from "lucide-react"
import { collection, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentClassesPage() {
  const { user } = useUser()
  const db = useFirestore()

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("studentIds", "array-contains", user.uid))
  }, [db, user?.uid])

  const { data: joinedClasses, isLoading } = useCollection(classesQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">My Classrooms</h1>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Join Class
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : !joinedClasses || joinedClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/5">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No classes joined yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                You haven't joined any active classrooms. Use your class code to get started with your learning journey.
              </p>
              <Button variant="outline">Browse Public Classes</Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {joinedClasses.map((cls) => (
                <Card key={cls.id} className="shadow-sm hover:shadow-md transition-shadow group overflow-hidden border-none">
                  <div className="h-2 bg-primary" />
                  <CardHeader>
                    <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{cls.name}</CardTitle>
                    <CardDescription>{cls.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">{cls.description || "No description provided."}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
                        <span>Course Material</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="h-1" />
                    </div>
                    <Button variant="secondary" className="w-full" size="sm">Enter Classroom</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
