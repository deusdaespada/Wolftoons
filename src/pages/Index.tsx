import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Clock, Star, Zap, Sparkles, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import MangaCard from "@/components/MangaCard";
import RecentUpdatesSection from "@/components/RecentUpdatesSection";
import RecentUpdatesSkeleton from "@/components/RecentUpdatesSkeleton";
import LoadingSection from "@/components/LoadingSection";
import HeroCarousel from "@/components/HeroCarousel";
import { useTitles } from "@/hooks/useTitles";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useGroupedRecentChapters } from "@/hooks/useGroupedRecentChapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  useVisitorTracking();
  const { data: titles, isLoading: titlesLoading } = useTitles();
  const { data: groupedChapters, isLoading: chaptersLoading } = useGroupedRecentChapters(10);
  
  const featured = titles?.slice(0, 4) || [];
  const trending = titles?.sort((a, b) => b.views - a.views).slice(0, 8) || [];
  const recent = titles?.slice().reverse().slice(0, 8) || [];
  const heroTitles = titles?.sort((a, b) => b.views - a.views).slice(0, 5) || [];
  const topRated = titles?.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Carousel Section */}
      <section className="container mx-auto px-4 pt-6 pb-8">
        {titlesLoading ? (
          <Skeleton className="w-full h-[300px] md:h-[400px] rounded-xl" />
        ) : (
          <HeroCarousel titles={heroTitles} />
        )}
      </section>

      {/* Recent Updates Section */}
      {chaptersLoading ? (
        <RecentUpdatesSkeleton />
      ) : (
        <RecentUpdatesSection groupedChapters={groupedChapters || []} />
      )}

      {/* Featured Section */}
      {titlesLoading ? (
        <LoadingSection title="Em Destaque" count={4} columns={4} />
      ) : (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Em Destaque</h2>
                <p className="text-sm text-muted-foreground">Selecionados para você</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
              <Link to="/catalog">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((manga, index) => (
              <div 
                key={manga.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <MangaCard {...manga} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VIP Promotion Card */}
      <section className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-xl md:text-2xl font-semibold mb-2 text-foreground flex items-center justify-center md:justify-start gap-2">
                <Zap className="h-5 w-5 text-primary" />
                VIP Wolftoon
              </h3>
              <ul className="space-y-1 text-sm text-foreground/70">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-primary">✓</span> Experiência sem anúncios
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-primary">✓</span> Acesso antecipado a novos capítulos
                </li>
              </ul>
            </div>
            <div>
              <Button 
                size="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                asChild
              >
                <Link to="/vip">Seja VIP</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      {titlesLoading ? (
        <LoadingSection title="Mais Lidos" count={8} columns={4} />
      ) : (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Mais Lidos</h2>
                <p className="text-sm text-muted-foreground">Os títulos mais populares</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
              <Link to="/catalog">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {trending.map((manga, index) => (
              <div 
                key={manga.id}
                className="animate-fade-in relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge className={`
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                      text-white font-bold text-xs px-2
                    `}>
                      #{index + 1}
                    </Badge>
                  </div>
                )}
                <MangaCard {...manga} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Rated Section */}
      {titlesLoading ? (
        <LoadingSection title="Melhores Avaliados" count={6} columns={6} />
      ) : (
        <section className="container mx-auto px-4 py-12 bg-card/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Melhores Avaliados</h2>
                <p className="text-sm text-muted-foreground">Obras com as melhores notas</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
              <Link to="/ranking">
                Ver ranking <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topRated.map((manga, index) => (
              <div 
                key={manga.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MangaCard {...manga} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Section */}
      {titlesLoading ? (
        <LoadingSection title="Novos Títulos" count={8} columns={4} />
      ) : (
        <section className="container mx-auto px-4 py-12 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Novos Títulos</h2>
                <p className="text-sm text-muted-foreground">Adicionados recentemente</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
              <Link to="/catalog">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recent.map((manga, index) => (
              <div 
                key={manga.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MangaCard {...manga} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="font-display text-xl font-semibold text-foreground mb-2">
                🐺 Wolftoon
              </div>
              <p className="text-sm text-muted-foreground">
                Sua alcateia de histórias
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-medium text-sm mb-3">Navegação</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Início
                  </Link>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-primary transition-colors">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="hover:text-primary transition-colors">
                    Busca
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Comunidade</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/vip" className="hover:text-primary transition-colors">
                    ⭐ VIP
                  </Link>
                </li>
                <li>
                  <Link to="/ranking" className="hover:text-primary transition-colors">
                    🏆 Ranking
                  </Link>
                </li>
                <li>
                  <a href="https://discord.gg/6wUg8wssQv" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Discord
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Termos
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/dmca" className="hover:text-primary transition-colors">
                    DMCA
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Wolftoon. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
