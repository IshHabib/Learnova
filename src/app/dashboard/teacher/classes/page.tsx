
"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users, Calendar, MoreVertical, Loader2, Copy, Check, UserPlus, X, User } from "lucide-react"
import { collection, query, where, doc, setDoc, serverTimestamp, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
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
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function TeacherClassesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newClass, setNewClass] = useState({ name: "", subject: "", description: "" })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Management State
  const [managingClass, setManagingClass] = useState<any | null>(null)
  const [newStudentId, setNewStudentId] = useState("")
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "classes"), where("teacherId", "==", user.uid))
  }, [db, user?.uid])

  const { data: myClasses, isLoading } = useCollection(classesQuery)

  const handleCreateClass = () => {
    if (!user || !newClass.name || !newClass.subject) return
    setIsCreating(true)
    
    const classRef = doc(collection(db, "classes"))
    const classData = {
      id: classRef.id,
      name: newClass.name,
      subject: newClass.subject,
      description: newClass.description,
      teacherId: user.uid,
      studentIds: [],
      creationDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    }

    setDoc(classRef, classData)
      .then(() => {
        setNewClass({ name: "", subject: "", description: "" })
        toast({ title: "Class created successfully!" })
        setIsCreating(false)
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: classRef.path,
          operation: 'create',
          requestResourceData: classData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsCreating(false)
      })
  }

  const handleAddStudent = () => {
    if (!managingClass || !newStudentId.trim()) return
    setIsAddingStudent(true)
    
    const studentId = newStudentId.trim()
    const studentRef = doc(db, "users", studentId)
    
    getDoc(studentRef).then((studentSnap) => {
      if (!studentSnap.exists()) {
        toast({
          title: "User not found",
          description: "Please verify the Student ID and try again.",
          variant: "destructive"
        })
        setIsAddingStudent(false)
        return
      }

      const studentData = studentSnap.data()
      // Robust role check (case insensitive)
      if (studentData.role?.toLowerCase() !== "student") {
        toast({
          title: "Invalid Role",
          description: `This user is registered as a ${studentData.role} and cannot be added as a student.`,
          variant: "destructive"
        })
        setIsAddingStudent(false)
        return
      }

      const classRef = doc(db, "classes", managingClass.id)
      const updateData = {
        studentIds: arrayUnion(studentId)
      }

      updateDoc(classRef, updateData)
        .then(() => {
          toast({
            title: "Student Added!",
            description: `${studentData.name || "User"} has been enrolled in ${managingClass.name}.`
          })
          setNewStudentId("")
          setIsAddingStudent(false)
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: classRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          setIsAddingStudent(false)
        })
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: studentRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsAddingStudent(false)
    });
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast({ title: "Class ID copied!", description: "Share this with your students so they can join." })
    setTimeout(() => setCopiedId(null), 3000)
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
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : !myClasses || myClasses.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-muted/5">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">No active classes</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Start by creating your first digital classroom to begin your adaptive teaching journey.</p>
              <Button onClick={() => document.querySelector('[data-state="closed"]')?.dispatchEvent(new MouseEvent('click'))}>
                Create Your First Class
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((cls) => (
                <Card key={cls.id} className="group hover:ring-2 ring-primary/20 transition-all border-none shadow-sm overflow-hidden flex flex-col">
                  <div className="h-2 bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider mb-2">
                        {cls.subject}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="font-headline text-lg line-clamp-1">{cls.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 min-h-[2.5rem]">{cls.description || "Digital classroom environment for adaptive learning."}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 border-t mt-auto space-y-4">
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{cls.studentIds?.length || 0} Enrolled</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Joined {cls.creationDate ? format(new Date(cls.creationDate), "MMM d") : "Recently"}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-slate-50 border flex items-center justify-between group/id">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Class Join ID</p>
                        <p className="text-xs font-mono font-semibold">{cls.id}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => copyToClipboard(cls.id)}
                      >
                        {copiedId === cls.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setManagingClass(cls)}>Manage Students</Button>
                      <Button size="sm" className="flex-1 text-xs" onClick={() => window.location.href='/dashboard/teacher/content'}>Add Content</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Dialog open={!!managingClass} onOpenChange={(open) => !open && setManagingClass(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manage Enrollment
              </DialogTitle>
              <DialogDescription>
                Class: {managingClass?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Add Student Manually</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Paste Student User ID..." 
                      className="pl-9"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddStudent} disabled={isAddingStudent || !newStudentId.trim()}>
                    {isAddingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Ask students for their unique ID from their profile settings, or use the Class Join ID for self-enrollment.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Enrolled Students ({managingClass?.studentIds?.length || 0})</Label>
                <ScrollArea className="h-48 rounded-lg border bg-slate-50/50 p-2">
                  {managingClass?.studentIds?.length > 0 ? (
                    <div className="space-y-2">
                      {managingClass.studentIds.map((id: string) => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-mono font-medium truncate max-w-[120px]">{id}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] uppercase">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <p className="text-xs text-muted-foreground">No students enrolled yet.</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setManagingClass(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
