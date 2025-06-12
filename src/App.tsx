import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { SaveSystemProvider } from "@/contexts/SaveSystemContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SpeedInsights } from "@vercel/speed-insights/react"; // Import SpeedInsights
import "./styles/staffManagement.css";
import { useGameState } from "@/hooks/useGameState";
import { GameState } from "@/types/game";

import { useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { gameState, updateGameState } = useGameState();

  // Wrapper to match SaveSystemProvider's expected setGameState signature
  const setGameState = (stateOrUpdater: GameState | ((prevState: GameState) => GameState)) => {
    if (typeof stateOrUpdater === 'function') {
      updateGameState(stateOrUpdater as (prevState: GameState) => GameState);
    } else {
      updateGameState(() => stateOrUpdater as GameState);
    }
  };

  return (
    <SaveSystemProvider gameState={gameState} setGameState={setGameState}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Add a main landmark for accessibility */}
          <main>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
        <SpeedInsights /> {/* Add SpeedInsights component here */}
      </TooltipProvider>
    </SaveSystemProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider> {/* Ensure SettingsProvider wraps components that use useSettings */}
        <AppContent />
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
