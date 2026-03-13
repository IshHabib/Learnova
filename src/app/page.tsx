import Link from "next/link"
import { Brain, GraduationCap, ChevronRight, CheckCircle2, Zap, BarChart3, Users, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground">Learnova</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground">
                < Zap className="mr-2 h-4 w-4" />
                <span>Next-Gen Adaptive Learning</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground font-headline">
                Empower Every Mind with <span className="text-primary">Learnova</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                The AI-powered adaptive classroom intelligence platform that personalizes learning for students and provides deep insights for educators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-12 px-8 text-lg" asChild>
                  <Link href="/signup">
                    Sign Up Now <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
                  <Link href="/demo">Request a Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-card">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-headline mb-4">Features Built for Modern Education</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We use advanced AI to bridge the gap between teaching and understanding.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Personalized AI Tutoring", description: "Dynamic notes and quizzes generated specifically for your learning pace.", icon: Brain },
                { title: "Adaptive Assessments", description: "Real-time adjustments to quiz difficulty based on student performance.", icon: CheckCircle2 },
                { title: "Deep Analytics", description: "Visualize progress with comprehensive tracking and improvement trends.", icon: BarChart3 },
                { title: "Seamless Classrooms", description: "Teachers can manage classes, lectures, and content with a single click.", icon: GraduationCap },
                { title: "Study Group AI", description: "Intelligent grouping of students based on strengths and weaknesses.", icon: Users },
                { title: "Instant Feedback", description: "Real-time communication and AI suggestions for both students and teachers.", icon: MessageSquare },
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow bg-background">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t py-12">
        <div className="container px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold font-headline text-foreground">Learnova</span>
          </div>
          <p className="text-sm">© 2024 Learnova AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
