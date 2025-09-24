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
import DevMenu from "./components/DevMenu";
import BoxDropController from "./features/boxDrops/BoxDropController";

import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider> {/* Ensure SettingsProvider wraps components that use useSettings */}
        <SaveSystemProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
              {process.env.NODE_ENV === 'development' && <DevMenu />}
              <BoxDropController />
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
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
