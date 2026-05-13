import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import ObjectivePage from "@/pages/objective";
import Objectives from "@/pages/objectives";
import SpecifyPage from "@/pages/specify";
import AlignPage from "@/pages/align";
import LayoutPage from "@/pages/layout";
import CompletionPage from "@/pages/completion";
import Tasks from "@/pages/tasks";
import Habits from "@/pages/habits";
import Reviews from "@/pages/reviews";
import Journal from "@/pages/journal";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        <PublicOnlyRoute component={Login} />
      </Route>
      <Route path="/register">
        <PublicOnlyRoute component={Register} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/objective">
        <ProtectedRoute component={ObjectivePage} />
      </Route>
      <Route path="/objectives">
        <ProtectedRoute component={Objectives} />
      </Route>
      <Route path="/specify/:id">
        <ProtectedRoute component={SpecifyPage} />
      </Route>
      <Route path="/align/:id">
        <ProtectedRoute component={AlignPage} />
      </Route>
      <Route path="/layout/:id">
        <ProtectedRoute component={LayoutPage} />
      </Route>
      <Route path="/completion/:id">
        <ProtectedRoute component={CompletionPage} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      <Route path="/habits">
        <ProtectedRoute component={Habits} />
      </Route>
      <Route path="/reviews">
        <ProtectedRoute component={Reviews} />
      </Route>
      <Route path="/journal">
        <ProtectedRoute component={Journal} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
