import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTitle } from "@/hooks/useTitles";
import { useChapters } from "@/hooks/useChapters";
import { useIncrementViews } from "@/hooks/useIncrementViews";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useReadingStatus, STATUS_CONFIG, ReadingStatus } from "@/hooks/useReadingStatus";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import CommentsSection from "@/components/CommentsSection";
import RatingSection from "@/components/RatingSection";
import { 
  BookOpen, 
  Star, 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Share2, 
  Play, 
  Crown, 
  BookMarked, 
  CheckCircle, 
  Pause, 
  Trash2, 
  ListPlus
} from "lucide-react";

const MangaDetails = () => {
  const { slug } = useParams();
  const { data: manga, isLoading } = useTitle(slug || "");
  const { data: chapters } = useChapters(manga?.id || "");
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getProgressForTitle } = useReadingProgress();
  const { status: readingStatus, updateStatus, isInList } = useReadingStatus(manga?.id);
  
  const isFavorite = favorites?.includes(manga?.id || "") ?? false;
  const readingProgress = getProgressForTitle(manga?.id || "");
  const continueChapter = readingProgress?.chapter?.chapter_number || 1;
  
  // Increment views when user visits this page
  useIncrementViews(manga?.id);

  const statusIcons: Record<ReadingStatus, React.ReactNode> = {
    reading: <BookOpen className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4" />,
    planning: <BookMarked className="h-4 w-4" />,
    dropped: <Trash2 className="h-4 w-4" />,
    on_hold: <Pause className="h-4 w-4" />,
  };
  
  // Increment views when user visits this page
  useIncrementViews(manga?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Título não encontrado</h1>
          <Button asChild>
            <Link to="/catalog">Voltar ao Catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sortedChapters = chapters?.sort((a, b) => b.chapter_number - a.chapter_number) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid md:grid-cols-[300px,1fr] gap-8 mb-8">
          {/* Cover */}
          <div className="relative">
            <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border/40 glow-card sticky top-20">
              <img
                src={manga.cover}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/90 text-primary-foreground border-0">
                  {manga.type}
                </Badge>
                <Badge variant={manga.status === "Completo" ? "secondary" : "outline"}>
                  {manga.status}
                </Badge>
              </div>
              
              <h1 className="font-display text-4xl font-semibold mb-2">
                {manga.title}
              </h1>
              
              {/* Alternative Titles */}
              {manga.alternative_titles && manga.alternative_titles.length > 0 && (
                <p className="text-sm text-muted-foreground mb-4 italic">
                  {manga.alternative_titles.join(' • ')}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map(genre => (
                  <span
                    key={genre}
                    className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card/50 rounded-lg p-4 border border-border/40">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Star className="h-4 w-4 fill-primary" />
                  <span className="font-semibold">{manga.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">Avaliação</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 border border-border/40">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-semibold">{chapters?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Capítulos</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 border border-border/40">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold">{(manga.views / 1000000).toFixed(1)}M</span>
                </div>
                <p className="text-xs text-muted-foreground">Visualizações</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 border border-border/40">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">{manga.year}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ano</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {readingProgress ? (
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  asChild
                >
                  <Link to={`/read/${manga.id}/${continueChapter}`}>
                    <Play className="mr-2 h-5 w-5" />
                    Continuar Cap. {continueChapter}
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  asChild
                >
                  <Link to={`/read/${manga.id}/1`}>
                    <BookOpen className="mr-2 h-5 w-5" />
                    Começar a Ler
                  </Link>
                </Button>
              )}
              
              <Button
                size="lg"
                variant="outline"
                className={`border-primary/50 ${isFavorite ? 'bg-primary/10 text-primary' : 'text-primary'} hover:bg-primary/10`}
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Login necessário",
                      description: "Faça login para adicionar aos favoritos",
                      variant: "destructive",
                    });
                    return;
                  }
                  toggleFavorite.mutate(
                    { titleId: manga?.id || "", isFavorite },
                    {
                      onSuccess: () => {
                        toast({
                          title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
                        });
                      },
                    }
                  );
                }}
                disabled={toggleFavorite.isPending}
              >
                <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-primary' : ''}`} />
                {isFavorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar
              </Button>

              {/* Reading Status Selector */}
              {user && (
                <Select
                  value={readingStatus || ''}
                  onValueChange={(value) => {
                    updateStatus.mutate(
                      { status: value as ReadingStatus },
                      {
                        onSuccess: () => {
                          toast({
                            title: "Lista atualizada",
                            description: `Adicionado como "${STATUS_CONFIG[value as ReadingStatus].label}"`,
                          });
                        },
                      }
                    );
                  }}
                >
                  <SelectTrigger className={`w-44 h-11 border-primary/50 ${isInList ? 'bg-primary/10' : ''}`}>
                    {isInList ? (
                      <span className="flex items-center gap-2">
                        {statusIcons[readingStatus!]}
                        {STATUS_CONFIG[readingStatus!]?.label}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ListPlus className="h-4 w-4" />
                        Adicionar à Lista
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="flex items-center gap-2">
                          {statusIcons[status]}
                          {STATUS_CONFIG[status].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Rating Section */}
            <RatingSection titleId={manga.id} />

            <Separator className="bg-border/40" />

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Autor: <span className="text-foreground">{manga.author}</span></span>
              </div>
              
              <h2 className="font-display text-xl font-medium mb-3">Sinopse</h2>
              <p className="text-muted-foreground leading-relaxed">{manga.synopsis}</p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-card/50 rounded-xl border border-border/40 p-6">
          <h2 className="font-display text-2xl font-semibold mb-6">Lista de Capítulos</h2>
          
          {sortedChapters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum capítulo disponível ainda.</p>
          ) : (
            <div className="space-y-2">
              {sortedChapters.map(chapter => (
                <Link
                  key={chapter.id}
                  to={`/read/${manga.id}/${chapter.chapter_number}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium group-hover:text-primary transition-colors">
                      Capítulo {chapter.chapter_number}
                      {chapter.chapter_title && ` - ${chapter.chapter_title}`}
                    </span>
                    {chapter.is_vip && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(chapter.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-card/50 rounded-xl border border-border/40 p-6 mt-6">
          <CommentsSection titleId={manga?.id} />
        </div>
      </div>
    </div>
  );
};

export default MangaDetails;
