import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SaveSystemProvider } from "@/contexts/SaveSystemContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SpeedInsights } from "@vercel/speed-insights/react";
import DevMenu from "./components/DevMenu";
import BoxDropController from "./features/boxDrops/BoxDropController";
import { CutsceneDirector } from "./components/cutscenes/CutsceneDirector";
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SaveSystemProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {process.env.NODE_ENV === 'development' && <DevMenu />}
            <BoxDropController />
            <CutsceneDirector />
            <BrowserRouter>
              <main>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </BrowserRouter>
            <SpeedInsights />
          </TooltipProvider>
        </SaveSystemProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
