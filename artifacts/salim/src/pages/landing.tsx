import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Nav */}
      <header className="py-6 px-8 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="font-serif text-2xl font-bold tracking-tight text-primary">
          S.A.L.I.M.
        </div>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/objective">Mon parcours <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Se connecter
              </Link>
              <Button asChild>
                <Link href="/register">Commencer</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">

        {/* Hero */}
        <div className="max-w-3xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.2em] mb-6">
            Méthode de développement personnel
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-8 leading-tight">
            You don't need more motivation.
            <br />
            <span className="text-primary">You need clarity and discipline.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            S.A.L.I.M. est une méthode structurée pour atteindre un objectif à la fois, avec précision,
            sens et discipline. Pas de gamification. Pas de comparaison. Juste toi et ton engagement.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button size="lg" className="text-base px-8 h-12 w-full sm:w-auto" asChild>
              <Link href={isAuthenticated ? "/objective" : "/register"}>
                Begin my journey <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" className="text-base px-8 h-12 w-full sm:w-auto" asChild>
                <Link href="/login">Je reviens sur mon parcours</Link>
              </Button>
            )}
          </div>

          {/* Ethical message */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              Aucune fausse promesse. Aucun système de points. Aucune comparaison sociale.
              Seulement un travail honnête sur toi-même.
            </span>
          </div>
        </div>

        {/* SALIM method */}
        <div className="w-full max-w-5xl mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-5 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              {
                letter: "S",
                title: "Specify",
                desc: "Clarifie ton objectif avec une précision SMART. Pas de flou, pas d'ambiguïté.",
              },
              {
                letter: "A",
                title: "Align",
                desc: "Connecte ton objectif à ta mission profonde et à tes valeurs. Donne-lui du sens.",
              },
              {
                letter: "L",
                title: "Lay out",
                desc: "Structure un plan en 90 jours avec des jalons clairs et une priorité simple.",
              },
              {
                letter: "I",
                title: "Implement",
                desc: "Une action prioritaire par jour. Des revues hebdomadaires conscientes.",
              },
              {
                letter: "M",
                title: "Maintain",
                desc: "Suivi des habitudes clés. Constance sans perfectionnisme. Durée dans le temps.",
              },
            ].map((step) => (
              <div key={step.letter} className="bg-card p-6 text-left">
                <div className="text-3xl font-serif font-bold text-primary/20 mb-3">{step.letter}</div>
                <h3 className="font-serif font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="max-w-2xl mx-auto mb-20 px-4">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Les principes UX de SALIM</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "1 objectif principal à la fois",
              "1 action prioritaire par jour",
              "1 étape à la fois, dans l'ordre",
              "Pas de surcharge d'information",
              "Pas de comparaison sociale",
              "Progression mesurée sur soi-même",
            ].map((p) => (
              <div key={p} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Positioning statement */}
        <div className="max-w-2xl mx-auto mb-16 px-4 text-center">
          <blockquote className="border-l-4 border-primary pl-6 text-left">
            <p className="font-serif text-xl text-foreground font-semibold leading-snug italic">
              "SALIM is not a productivity app.<br />
              It is a disciplined path from purpose to action."
            </p>
          </blockquote>
        </div>

        {/* Daily time commitment */}
        <div className="max-w-2xl mx-auto mb-16 px-4">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <p className="text-4xl font-serif font-bold text-primary mb-2">3–5 min</p>
            <p className="text-foreground font-medium mb-2">par jour</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Une seule action prioritaire. Aucune surcharge cognitive. L'app s'efface pour te laisser agir.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-lg mx-auto text-center mb-24 px-4">
          <p className="text-muted-foreground mb-6 text-base">
            L'objectif ultime de S.A.L.I.M. n'est pas de te rendre dépendant d'une app —
            c'est de t'aider à devenir quelqu'un qui agit par discipline, et non par motivation.
          </p>
          <Button size="lg" className="w-full sm:w-auto px-10 h-12 text-base" asChild>
            <Link href={isAuthenticated ? "/objective" : "/register"}>
              Commencer mon parcours <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} S.A.L.I.M. — Une méthode, un objectif, une transformation.
      </footer>
    </div>
  );
}
