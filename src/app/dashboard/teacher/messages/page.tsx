"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, Search } from "lucide-react"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function TeacherMessagesPage() {
  const { user } = useUser()
  const db = useFirestore()

  const chatsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "chatSessions"),
      where("participantIds", "array-contains", user.uid),
      orderBy("lastMessageTimestamp", "desc")
    )
  }, [db, user?.uid])

  const { data: chats, isLoading } = useCollection(chatsQuery)

  return (
    <SidebarProvider>
      <AppSidebar role="teacher" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Inbox</h1>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r bg-card hidden md:block">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input className="w-full bg-background border rounded-lg py-2 pl-9 text-xs" placeholder="Search students..." />
              </div>
            </div>
            <div className="overflow-auto h-full pb-20">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 m-2 rounded-lg" />)
              ) : !chats || chats.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-muted-foreground italic">Your student inbox is empty.</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div key={chat.id} className="p-4 border-b hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>S</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">Student Name</p>
                        <p className="text-[10px] text-muted-foreground truncate">Last message content preview...</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary opacity-40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Student Communication</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open a conversation to provide personalized guidance or answer student questions.
            </p>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}