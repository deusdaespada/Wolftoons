import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/useTitles";
import { useChapter, useChapters } from "@/hooks/useChapters";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useAntiExtension } from "@/hooks/useAntiExtension";
import AntiExtensionBlock from "@/components/AntiExtensionBlock";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Settings, ChevronDown, Download, MessageCircle, Type, Minus, Plus, Crown, Lock } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import CommentsSection from "@/components/CommentsSection";
import PollsSection from "@/components/PollsSection";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const Reader = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user, isVip } = useAuth();
  const { isBlocked, reason, addWatermark, showCaptcha, captchaReason, onCaptchaSuccess, onCaptchaFailure } = useAntiExtension();
  const { data: manga, isLoading: mangaLoading } = useTitle(id || "");
  const { data: chapterData, isLoading: chapterLoading } = useChapter(id || "", parseInt(chapter ?? "0"));
  const { data: allChapters } = useChapters(id || "");
  const { updateProgress } = useReadingProgress();
  const { addToHistory } = useReadingHistory();
  const currentChapter = parseInt(chapter ?? "0");
  const [pageWidth, setPageWidth] = useState(100);
  const [showComments, setShowComments] = useState(false);
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal">("vertical");
  const [theme, setTheme] = useState<"dark" | "light" | "sepia">("dark");
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [lineHeight, setLineHeight] = useState(1.8);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const rawPages = chapterData?.images || [];
  const totalPages = rawPages.length;
  const isNovel = chapterData?.content_type === 'novel';
  const novelContent = chapterData?.content || '';

  // Use raw pages directly without proxy for better performance
  const pages = rawPages;

  // Add watermark with user ID
  useEffect(() => {
    if (user?.id) {
      const cleanup = addWatermark(user.id);
      return cleanup;
    }
  }, [user?.id, addWatermark]);

  // Track reading progress and history
  useEffect(() => {
    if (user && manga && chapterData) {
      updateProgress({
        titleId: manga.id,
        chapterId: chapterData.id,
        pageNumber: readingMode === "horizontal" ? currentPage + 1 : 1,
        completed: false,
      });
      addToHistory({
        titleId: manga.id,
        chapterId: chapterData.id,
      });
    }
  }, [user, manga, chapterData]);

  // Legacy localStorage fallback
  useEffect(() => {
    if (manga && chapter) {
      localStorage.setItem(`reading_${manga.id}`, chapter);
    }
  }, [manga, chapter]);

  // Reset page when changing chapters
  useEffect(() => {
    setCurrentPage(0);
  }, [chapter]);

  // Horizontal swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (readingMode !== "horizontal") return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (diff < 0 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    }
  }, [readingMode, currentPage, totalPages]);

  // Download chapter as ZIP - use original URLs for download
  const handleDownload = async () => {
    if (rawPages.length === 0) return;
    
    setIsDownloading(true);
    toast.info("Preparando download...");
    
    try {
      const zip = new JSZip();
      const folder = zip.folder(`${manga?.title || 'manga'}_cap${currentChapter}`);
      
      // Download images directly
      for (let i = 0; i < rawPages.length; i++) {
        const response = await fetch(rawPages[i]);
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'jpg';
        folder?.file(`pagina_${String(i + 1).padStart(3, '0')}.${extension}`, blob);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${manga?.title || 'manga'}_capitulo_${currentChapter}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Download concluído!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar capítulo");
    } finally {
      setIsDownloading(false);
    }
  };

  // Theme styles
  const getThemeBg = () => {
    switch (theme) {
      case "light": return "bg-white";
      case "sepia": return "bg-amber-50";
      default: return "bg-zinc-950";
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case "light": return "text-gray-900";
      case "sepia": return "text-amber-900";
      default: return "text-gray-100";
    }
  };

  const getFontClass = () => {
    switch (fontFamily) {
      case "serif": return "font-serif";
      case "mono": return "font-mono";
      default: return "font-sans";
    }
  };

  // Show CAPTCHA if needed, or block if extension detected
  if (isBlocked || showCaptcha) {
    return (
      <AntiExtensionBlock 
        reason={reason} 
        showCaptcha={showCaptcha}
        captchaReason={captchaReason}
        onCaptchaSuccess={onCaptchaSuccess}
        onCaptchaFailure={onCaptchaFailure}
      />
    );
  }

  if (mangaLoading || chapterLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!manga || !chapterData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Capítulo não encontrado</h1>
          <Button asChild>
            <Link to="/catalog">Voltar ao Catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  // VIP Access Check
  const isVipChapter = chapterData.is_vip;
  const hasVipAccess = isVip;
  
  if (isVipChapter && !hasVipAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6 p-4 rounded-full bg-primary/10 inline-block">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Conteúdo Exclusivo VIP</h1>
          <p className="text-muted-foreground mb-6">
            Este capítulo é exclusivo para membros VIP. Torne-se VIP para ter acesso a todos os capítulos exclusivos e muito mais!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/vip">
                <Crown className="mr-2 h-5 w-5" />
                Seja VIP
              </Link>
            </Button>
            <Button variant="outline" onClick={() => navigate(`/manga/${manga.id}`)}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const minChapter = allChapters?.reduce((min, ch) => Math.min(min, ch.chapter_number), currentChapter) ?? 0;
  const maxChapter = allChapters?.reduce((max, ch) => Math.max(max, ch.chapter_number), 0) || currentChapter;
  const hasNextChapter = currentChapter < maxChapter;
  const hasPrevChapter = currentChapter > minChapter;
  const sortedChapters = [...(allChapters || [])].sort((a, b) => b.chapter_number - a.chapter_number);

  return (
    <div className={`min-h-screen ${getThemeBg()}`}>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-2 md:px-4">
          {/* Left: Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/manga/${manga.id}`)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Center: Chapter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-1 px-3"
              >
                Capítulo {currentChapter}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="max-h-80 overflow-y-auto bg-zinc-800 border-zinc-700"
              align="center"
            >
              {sortedChapters.map((ch) => (
                <DropdownMenuItem
                  key={ch.id}
                  className={`cursor-pointer ${ch.chapter_number === currentChapter ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-zinc-700'}`}
                  onClick={() => navigate(`/read/${manga.id}/${ch.chapter_number}`)}
                >
                  Capítulo {ch.chapter_number}
                  {ch.chapter_title && ` - ${ch.chapter_title}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right: Navigation arrows and settings */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasPrevChapter}
              onClick={() => hasPrevChapter && navigate(`/read/${manga.id}/${currentChapter - 1}`)}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasNextChapter}
              onClick={() => hasNextChapter && navigate(`/read/${manga.id}/${currentChapter + 1}`)}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-amber-400 hover:bg-white/10"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-800 border-zinc-700 text-white w-80">
                <SheetHeader>
                  <SheetTitle className="text-white">Configurações</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Reading Mode - only for images */}
                  {!isNovel && (
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-300">Modo de Leitura</label>
                      <Select value={readingMode} onValueChange={(v) => setReadingMode(v as "vertical" | "horizontal")}>
                        <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-700 border-zinc-600">
                          <SelectItem value="vertical" className="text-white hover:bg-zinc-600">
                            Vertical (Webtoon)
                          </SelectItem>
                          <SelectItem value="horizontal" className="text-white hover:bg-zinc-600">
                            Horizontal (Página)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Page Width - only for images */}
                  {!isNovel && (
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-300">Largura da Página: {pageWidth}%</label>
                      <Slider
                        value={[pageWidth]}
                        onValueChange={(v) => setPageWidth(v[0])}
                        min={50}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                    </div>
                  )}

                  {/* Novel Settings */}
                  {isNovel && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-300">Tamanho da Fonte: {fontSize}px</label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                            className="border-zinc-600 text-white hover:bg-zinc-700 h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Slider
                            value={[fontSize]}
                            onValueChange={(v) => setFontSize(v[0])}
                            min={12}
                            max={32}
                            step={1}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                            className="border-zinc-600 text-white hover:bg-zinc-700 h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-300">Fonte</label>
                        <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as "sans" | "serif" | "mono")}>
                          <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-700 border-zinc-600">
                            <SelectItem value="sans" className="text-white hover:bg-zinc-600">
                              Sans-serif
                            </SelectItem>
                            <SelectItem value="serif" className="text-white hover:bg-zinc-600">
                              Serif
                            </SelectItem>
                            <SelectItem value="mono" className="text-white hover:bg-zinc-600">
                              Monospace
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-300">Espaçamento: {lineHeight}x</label>
                        <Slider
                          value={[lineHeight]}
                          onValueChange={(v) => setLineHeight(v[0])}
                          min={1.2}
                          max={2.5}
                          step={0.1}
                          className="py-2"
                        />
                      </div>
                    </>
                  )}

                  {/* Theme */}
                  <div className="space-y-3">
                    <label className="text-sm text-zinc-300">Tema</label>
                    <div className="flex gap-2">
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className={theme === "dark" ? "bg-primary" : "border-zinc-600 text-white hover:bg-zinc-700"}
                      >
                        Escuro
                      </Button>
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className={theme === "light" ? "bg-primary" : "border-zinc-600 text-white hover:bg-zinc-700"}
                      >
                        Claro
                      </Button>
                      <Button
                        variant={theme === "sepia" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("sepia")}
                        className={theme === "sepia" ? "bg-primary" : "border-zinc-600 text-white hover:bg-zinc-700"}
                      >
                        Sépia
                      </Button>
                    </div>
                  </div>

                  {/* Download - only for images */}
                  {!isNovel && (
                    <div className="pt-4 border-t border-zinc-700">
                      <Button
                        variant="outline"
                        className="w-full border-zinc-600 text-white hover:bg-zinc-700"
                        onClick={handleDownload}
                        disabled={isDownloading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloading ? "Baixando..." : "Baixar Capítulo"}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Reader Content */}
      <main 
        className={`pt-14 ${getThemeBg()}`}
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isNovel ? (
          /* Novel Reader Mode */
          <div 
            className={`max-w-3xl mx-auto px-6 py-8 ${getThemeText()} ${getFontClass()}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: novelContent
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                  .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-3">$1</h2>')
                  .replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
                  .replace(/^---$/gm, '<hr class="my-6 border-border" />')
                  .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
                  .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
                  .replace(/\n/g, '<br />')
              }}
            />
          </div>
        ) : readingMode === "horizontal" ? (
          /* Horizontal Mode - One page at a time with swipe */
          <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
            {pages[currentPage] && (
              <img
                src={pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                className="max-h-[calc(100vh-5rem)] object-contain"
                style={{ maxWidth: `${pageWidth}%` }}
                draggable={false}
              />
            )}
          </div>
        ) : (
          /* Vertical Mode - All pages stacked */
          <div 
            className="flex flex-col items-center mx-auto"
            style={{ maxWidth: `${pageWidth}%` }}
          >
            {pages.map((page, index) => (
              <img
                key={index}
                src={page}
                alt={`Página ${index + 1}`}
                className="w-full h-auto block"
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
        )}

        {/* End of Chapter Section */}
        <div className={`py-12 px-4 ${getThemeBg()}`}>
          <div className="max-w-xl mx-auto text-center">
            <p className={`text-lg mb-6 ${theme === "dark" ? "text-white" : theme === "sepia" ? "text-amber-900" : "text-gray-900"}`}>
              Fim do capítulo {currentChapter}
            </p>
            
            <div className="flex gap-3 justify-center mb-8">
              <Button
                variant="outline"
                disabled={!hasPrevChapter}
                onClick={() => hasPrevChapter && navigate(`/read/${manga.id}/${currentChapter - 1}`)}
                className={`${theme === "dark" ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300"}`}
              >
                Capítulo Anterior
              </Button>
              <Button
                disabled={!hasNextChapter}
                onClick={() => hasNextChapter && navigate(`/read/${manga.id}/${currentChapter + 1}`)}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Próximo Capítulo
              </Button>
            </div>

            {/* Polls Section */}
            <div className="bg-zinc-900 rounded-lg p-4 text-left">
              <PollsSection chapterId={chapterData.id} />
            </div>

            {/* Comments Section */}
            <div className="bg-zinc-900 rounded-lg p-4 text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-semibold">Comentários</span>
                </div>
              </div>
              
              <CommentsSection chapterId={chapterData.id} />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation - Horizontal Mode Only (images only) */}
      {readingMode === "horizontal" && !isNovel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-zinc-800/95 backdrop-blur border border-zinc-700 rounded-full p-2 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="rounded-full text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="px-4 text-sm font-medium text-white flex flex-col items-center">
              <span>Página</span>
              <span>{currentPage + 1}/{totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="rounded-full text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
