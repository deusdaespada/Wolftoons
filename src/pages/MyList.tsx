import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTitles } from "@/hooks/useTitles";
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Star, 
  Clock, 
  CheckCircle, 
  Pause, 
  BookMarked,
  ListFilter,
  Grid3X3,
  List
} from "lucide-react";

type ReadingStatus = 'reading' | 'completed' | 'planning' | 'dropped' | 'on_hold';

const STATUS_CONFIG: Record<ReadingStatus, { label: string; icon: React.ReactNode; color: string }> = {
  reading: { label: 'Lendo', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
  completed: { label: 'Completo', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500' },
  planning: { label: 'Planejando', icon: <BookMarked className="h-4 w-4" />, color: 'text-yellow-500' },
  dropped: { label: 'Dropado', icon: <Trash2 className="h-4 w-4" />, color: 'text-red-500' },
  on_hold: { label: 'Em Pausa', icon: <Pause className="h-4 w-4" />, color: 'text-gray-500' },
};

const MyList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: titles } = useTitles();

  const { data: userReadingStatus, isLoading } = useQuery({
    queryKey: ['user-reading-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_reading_status')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ titleId, status }: { titleId: string; status: ReadingStatus }) => {
      const existing = userReadingStatus?.find(s => s.title_id === titleId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_reading_status')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_reading_status')
          .insert({ user_id: user?.id, title_id: titleId, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reading-status'] });
    },
  });

  const removeFromList = useMutation({
    mutationFn: async (titleId: string) => {
      const { error } = await supabase
        .from('user_reading_status')
        .delete()
        .eq('user_id', user?.id)
        .eq('title_id', titleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reading-status'] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <BookMarked className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-3xl font-bold mb-4">Minha Lista</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar sua lista pessoal de leitura.
          </p>
          <Button asChild>
            <Link to="/auth">Fazer Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const userTitlesWithStatus = userReadingStatus?.map(status => {
    const title = titles?.find(t => t.id === status.title_id);
    return { ...status, title };
  }).filter(item => item.title) || [];

  const filteredTitles = userTitlesWithStatus.filter(item => {
    const matchesSearch = item.title?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.title?.alternative_titles?.some(alt => 
                            alt.toLowerCase().includes(searchQuery.toLowerCase())
                          );
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: userTitlesWithStatus.length,
    reading: userTitlesWithStatus.filter(t => t.status === 'reading').length,
    completed: userTitlesWithStatus.filter(t => t.status === 'completed').length,
    planning: userTitlesWithStatus.filter(t => t.status === 'planning').length,
    on_hold: userTitlesWithStatus.filter(t => t.status === 'on_hold').length,
    dropped: userTitlesWithStatus.filter(t => t.status === 'dropped').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <BookMarked className="h-8 w-8 text-primary" />
              Minha Lista
            </h1>
            <p className="text-muted-foreground mt-1">
              {userTitlesWithStatus.length} títulos na sua lista
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na lista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ReadingStatus | 'all')}>
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-6">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos ({statusCounts.all})
            </TabsTrigger>
            {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((status) => (
              <TabsTrigger 
                key={status} 
                value={status}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
              >
                {STATUS_CONFIG[status].icon}
                {STATUS_CONFIG[status].label} ({statusCounts[status]})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-0">
            {isLoading ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "space-y-3"
              }>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={viewMode === 'grid' ? "aspect-[2/3]" : "h-24"} />
                ))}
              </div>
            ) : filteredTitles.length === 0 ? (
              <div className="text-center py-16">
                <ListFilter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum título encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Nenhum título corresponde à sua busca."
                    : "Adicione títulos à sua lista a partir do catálogo."
                  }
                </p>
                <Button asChild className="mt-4">
                  <Link to="/catalog">Explorar Catálogo</Link>
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTitles.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group overflow-hidden bg-card/50 border-border/40 hover:border-primary/50 transition-all hover-lift"
                  >
                    <Link to={`/manga/${item.title?.slug || item.title_id}`}>
                      <div className="relative aspect-[2/3]">
                        <img
                          src={item.title?.cover}
                          alt={item.title?.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className={`${STATUS_CONFIG[item.status as ReadingStatus]?.color} bg-black/70`}>
                            {STATUS_CONFIG[item.status as ReadingStatus]?.icon}
                          </Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {item.title?.title}
                      </h3>
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatus.mutate({ 
                          titleId: item.title_id, 
                          status: value as ReadingStatus 
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((status) => (
                            <SelectItem key={status} value={status}>
                              <span className="flex items-center gap-2">
                                {STATUS_CONFIG[status].icon}
                                {STATUS_CONFIG[status].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTitles.map((item) => (
                  <Card key={item.id} className="bg-card/50 border-border/40 hover:border-primary/50 transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link to={`/manga/${item.title?.slug || item.title_id}`}>
                        <img
                          src={item.title?.cover}
                          alt={item.title?.title}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/manga/${item.title?.slug || item.title_id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                            {item.title?.title}
                          </h3>
                        </Link>
                        {item.title?.alternative_titles && item.title.alternative_titles.length > 0 && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.title.alternative_titles.join(' • ')}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-primary fill-primary" />
                            {item.title?.rating?.toFixed(1) || 'N/A'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.title?.type}
                          </Badge>
                          <Badge variant={item.title?.status === 'Completo' ? 'secondary' : 'outline'} className="text-xs">
                            {item.title?.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateStatus.mutate({ 
                            titleId: item.title_id, 
                            status: value as ReadingStatus 
                          })}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((status) => (
                              <SelectItem key={status} value={status}>
                                <span className="flex items-center gap-2">
                                  {STATUS_CONFIG[status].icon}
                                  {STATUS_CONFIG[status].label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromList.mutate(item.title_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyList;
