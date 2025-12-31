import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DogsProvider } from "@/context/DogsContext";
import Index from "./pages/Index";
import DogProfile from "./pages/DogProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DogsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dog/:id" element={<DogProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DogsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
