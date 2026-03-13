
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
  Settings,
  GraduationCap,
} from "lucide-react"

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

export function AppSidebar({ role = "student", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "student" | "teacher" }) {
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

  const currentNav = role === "teacher" ? teacherNav : studentNav

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
                <span className="truncate font-semibold">CognitoLearn</span>
                <span className="truncate text-xs">Adaptive Intelligence</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={currentNav} label={role === "teacher" ? "Teacher Portal" : "Student Portal"} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="https://picsum.photos/seed/user1/32/32" alt="User" />
                <AvatarFallback className="rounded-lg">CL</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Alex Johnson</span>
                <span className="truncate text-xs">{role === "teacher" ? "Professor" : "Student"}</span>
              </div>
              <Settings className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
