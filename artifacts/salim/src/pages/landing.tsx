import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="py-6 px-8 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="font-serif text-2xl font-bold tracking-tight text-primary">
          S.A.L.I.M.
        </div>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log In
              </Link>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
          Achieve one meaningful goal at a time.
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
          The S.A.L.I.M. method is a structured approach to personal transformation.
          Specify, Align, Lay out, Implement, and Maintain your most important objectives.
        </p>
        
        <div className="flex gap-4">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <Link href="/register">Start Your Journey</Link>
          </Button>
        </div>

        <div className="mt-32 grid md:grid-cols-5 gap-8 text-left max-w-5xl mx-auto">
          {[
            { letter: "S", title: "Specify", desc: "Define your SMART goal with absolute clarity." },
            { letter: "A", title: "Align", desc: "Connect your goal to your deeper values." },
            { letter: "L", title: "Lay out", desc: "Create a focused 90-day milestone plan." },
            { letter: "I", title: "Implement", desc: "Execute daily tasks and build habits." },
            { letter: "M", title: "Maintain", desc: "Review progress and sustain momentum." }
          ].map((step, i) => (
            <div key={i} className="flex flex-col">
              <div className="text-4xl font-serif text-primary/20 font-bold mb-2">{step.letter}</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
