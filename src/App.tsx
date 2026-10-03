import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
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
import DealerController from "./monetization/DealerController";
import PremiumRevealController from "./monetization/PremiumRevealController";
import { CutsceneDirector } from "./components/cutscenes/CutsceneDirector";
import { MotionConfig } from "framer-motion";
import './App.css';

// Dev only (#57): the whole lab is behind a DEV-gated dynamic import, so production bundles never include it.
const LazyWorkbench = import.meta.env.DEV ? React.lazy(() => import('./content/WorkbenchLauncher')) : () => null;
const LazyBalanceLab = import.meta.env.DEV ? React.lazy(() => import('./dev/balance/BalanceLabLauncher')) : () => null;
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SaveSystemProvider>
          <TooltipProvider>
            <MotionConfig reducedMotion="user">
              {/* Single Sonner host — avoid mounting a duplicate toaster. */}
              <Toaster />
              {process.env.NODE_ENV === 'development' && <DevMenu />}
              {import.meta.env.DEV && <Suspense fallback={null}><LazyBalanceLab /><LazyWorkbench /></Suspense>}
              <BoxDropController />
              <DealerController />
              <PremiumRevealController />
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
            </MotionConfig>
          </TooltipProvider>
        </SaveSystemProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
