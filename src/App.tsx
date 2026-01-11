import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import MangaDetails from "./pages/MangaDetails";
import Reader from "./pages/Reader";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ComicCreator from "./pages/ComicCreator";
import NovelCreator from "./pages/NovelCreator";
import ChapterUpload from "./pages/ChapterUpload";
import BatchChapterUpload from "./pages/BatchChapterUpload";
import Vip from "./pages/Vip";
import VipStatus from "./pages/VipStatus";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Dmca from "./pages/Dmca";
import Ranking from "./pages/Ranking";
import Install from "./pages/Install";
import MyList from "./pages/MyList";
import NotFound from "./pages/NotFound";
import { useBlockedAccessNotifications } from "./hooks/useBlockedAccessNotifications";

const queryClient = new QueryClient();

// Component to initialize global hooks
const GlobalHooks = () => {
  useBlockedAccessNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GlobalHooks />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/manga/:slug" element={<MangaDetails />} />
            <Route path="/read/:id/:chapter" element={<Reader />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/create-comic" element={<ComicCreator />} />
            <Route path="/admin/create-novel" element={<NovelCreator />} />
            <Route path="/admin/upload-chapter" element={<ChapterUpload />} />
            <Route path="/admin/batch-upload" element={<BatchChapterUpload />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/vip/status" element={<VipStatus />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dmca" element={<Dmca />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/install" element={<Install />} />
            <Route path="/my-list" element={<MyList />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
