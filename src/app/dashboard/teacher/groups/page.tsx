"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Brain, Sparkles } from "lucide-react"
import { collectionGroup, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherGroupsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const groupsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collectionGroup(db, "studyGroups"), where("classTeacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: groups, isLoading } = useCollection(groupsQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Study Groups</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                AI Generate Groups
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-sm bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Collaboration Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our AI can analyze student performance and group learners by complementary strengths to maximize peer-to-peer tutoring efficiency.
                </p>
              </CardContent>
            </Card>

            {isLoading ? (
              Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : !groups || groups.length === 0 ? (
              <div className="col-span-full py-24 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-bold">No study groups created</h3>
                <p className="text-sm text-muted-foreground">Form groups manually or use AI to suggest optimal student pairings.</p>
              </div>
            ) : (
              groups.map(group => (
                <Card key={group.id} className="border-none shadow-sm hover:ring-2 ring-primary/20 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">{group.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider">{group.studentIds?.length || 0} Members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {group.focusTopics?.map((topic: string) => (
                        <span key={topic} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">{topic}</span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs">Manage Group</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}