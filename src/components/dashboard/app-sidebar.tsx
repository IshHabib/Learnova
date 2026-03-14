"use client"

import * as React from "react"
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Video,
  FileText,
  Brain,
  Users,
  LogOut,
  GraduationCap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"

import { NavMain } from "@/components/dashboard/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function AppSidebar({ role = "student", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "student" | "teacher" }) {
  const [userName, setUserName] = React.useState("User")
  const [userRole, setUserRole] = React.useState(role)
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || "User")
        // Added error callback to snapshot listener to prevent unhandled exceptions
        const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            setUserName(data.name || data.displayName || user.displayName || "User")
            setUserRole(data.role || role)
          }
        }, (error) => {
          console.warn("Sidebar: Failed to fetch user profile", error)
        })
        return () => unsubscribeDoc()
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribeAuth()
  }, [auth, db, role, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const studentNav = [
    { title: "Dashboard", url: "/dashboard/student", icon: LayoutDashboard },
    { title: "Classrooms", url: "/dashboard/student/classes", icon: GraduationCap },
    { title: "Study Notes", url: "/dashboard/student/notes", icon: FileText },
    { title: "Video Lessons", url: "/dashboard/student/videos", icon: Video },
    { title: "Quizzes", url: "/dashboard/student/quizzes", icon: BookOpen },
    { title: "AI Assistant", url: "/dashboard/student/ai-assistant", icon: Brain },
    { title: "Performance", url: "/dashboard/student/analytics", icon: BarChart3 },
    { title: "Messages", url: "/dashboard/student/messages", icon: MessageSquare },
  ]

  const teacherNav = [
    { title: "Overview", url: "/dashboard/teacher", icon: LayoutDashboard },
    { title: "My Classes", url: "/dashboard/teacher/classes", icon: GraduationCap },
    { title: "Live Lectures", url: "/dashboard/teacher/live", icon: Video },
    { title: "Content Library", url: "/dashboard/teacher/content", icon: FileText },
    { title: "Student Analytics", url: "/dashboard/teacher/analytics", icon: BarChart3 },
    { title: "Study Groups", url: "/dashboard/teacher/groups", icon: Users },
    { title: "Messages", url: "/dashboard/teacher/messages", icon: MessageSquare },
  ]

  const currentNav = userRole === "teacher" ? teacherNav : studentNav

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">Learnova</span>
                <span className="truncate text-xs text-muted-foreground">Adaptive Intelligence</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={currentNav} label={userRole === "teacher" ? "Teacher Portal" : "Student Portal"} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 p-2 w-full overflow-hidden">
              <Avatar className="h-8 w-8 rounded-lg shrink-0">
                <AvatarImage src={`https://picsum.photos/seed/${userName}/32/32`} alt={userName} />
                <AvatarFallback className="rounded-lg">{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-foreground">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{userRole === "teacher" ? "Professor" : "Student"}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-auto" onClick={handleSignOut}>
                <LogOut className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}