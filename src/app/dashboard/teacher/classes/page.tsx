
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users, Calendar, Settings, MoreVertical } from "lucide-react"
import { collection, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherClassesPage() {
  const { user } = useUser()
  const db = useFirestore()

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: myClasses, isLoading } = useCollection(classesQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Classroom Management</h1>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Input placeholder="Search your classes..." className="pl-10" />
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
            </div>
          ) : !myClasses || myClasses.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-2xl">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">No active classes</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first digital classroom.</p>
              <Button>Get Started</Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((cls) => (
                <Card key={cls.id} className="group hover:ring-2 ring-primary/20 transition-all border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                        {cls.subject}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="font-headline text-lg">{cls.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{cls.description || "Active session"}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 border-t space-y-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{cls.studentIds?.length || 0} Enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Mon / Wed</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                      <Button size="sm" className="flex-1">Go Live</Button>
                    </div>
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
