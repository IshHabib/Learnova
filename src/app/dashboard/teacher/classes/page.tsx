
"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users, Calendar, MoreVertical, Loader2 } from "lucide-react"
import { collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TeacherClassesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [isCreating, setIsCreating] = useState(false)
  const [newClass, setNewClass] = useState({ name: "", subject: "", description: "" })

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: myClasses, isLoading } = useCollection(classesQuery)

  const handleCreateClass = async () => {
    if (!user || !newClass.name || !newClass.subject) return
    setIsCreating(true)
    try {
      const classRef = doc(collection(db, "classes"))
      await setDoc(classRef, {
        id: classRef.id,
        name: newClass.name,
        subject: newClass.subject,
        description: newClass.description,
        teacherId: user.uid,
        studentIds: [],
        creationDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      })
      setNewClass({ name: "", subject: "", description: "" })
    } catch (error) {
      console.error("Error creating class:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold font-headline">Classroom Management</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Set up a new digital classroom for your students.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Advanced Mathematics Section A" 
                      value={newClass.name}
                      onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="e.g. Mathematics" 
                      value={newClass.subject}
                      onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Briefly describe what students will learn..." 
                      value={newClass.description}
                      onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateClass} disabled={isCreating || !newClass.name || !newClass.subject}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Classroom
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <span>Created {cls.creationDate ? format(new Date(cls.creationDate), "MMM d") : "recently"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                      <Button size="sm" className="flex-1">Add Content</Button>
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

import { format } from "date-fns"
