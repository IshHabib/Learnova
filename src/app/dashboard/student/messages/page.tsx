"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, User } from "lucide-react"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function StudentMessagesPage() {
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
      <AppSidebar role="student" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold font-headline">Messages</h1>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r bg-card hidden md:block">
            <div className="p-4 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversations</h2>
            </div>
            <div className="overflow-auto h-full">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 m-2 rounded-lg" />)
              ) : !chats || chats.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-muted-foreground">No messages yet.</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div key={chat.id} className="p-4 border-b hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>T</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">Instructor</p>
                        <p className="text-[10px] text-muted-foreground truncate">View conversation</p>
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
            <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Direct messaging with your instructors is available here for academic support.
            </p>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}