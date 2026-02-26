import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import MonkeyOS from "@/pages/MonkeyOS";
import Sanctuary from "@/pages/Sanctuary";
import Docs from "@/pages/Docs";
import HackathonAnimation from "@/pages/HackathonAnimation";
import PunchAnimation from "@/pages/PunchAnimation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app" component={MonkeyOS} />
      <Route path="/os" component={MonkeyOS} />
      <Route path="/sanctuary" component={Sanctuary} />
      <Route path="/docs" component={Docs} />
      <Route path="/hackathon" component={HackathonAnimation} />
      <Route path="/punch" component={PunchAnimation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
