import { useState } from "react";
import Header from "@/components/Header";
import MangaCard from "@/components/MangaCard";
import { useTitles } from "@/hooks/useTitles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X, Search } from "lucide-react";

const genres = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Romance",
  "Mistério",
  "Sobrenatural",
  "Artes Marciais",
  "Reencarnação",
  "Slice of Life",
  "Horror",
  "Psicológico",
  "Histórico",
];

const Catalog = () => {
  const { data: titles, isLoading } = useTitles();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [showFilters, setShowFilters] = useState(false);

  const filteredMangas = (titles || []).filter(manga => {
    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        manga.title.toLowerCase().includes(query) ||
        manga.author.toLowerCase().includes(query) ||
        manga.genres.some(genre => genre.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    if (selectedType !== "all" && manga.type !== selectedType) return false;
    if (selectedStatus !== "all" && manga.status !== selectedStatus) return false;
    if (selectedGenres.length > 0) {
      const hasGenre = selectedGenres.some(genre => manga.genres.includes(genre));
      if (!hasGenre) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "popularity") return b.views - a.views;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "recent") return b.year - a.year;
    return 0;
  });
  
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

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedGenres([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold mb-4">Catálogo Completo</h1>
          <p className="text-muted-foreground mb-6">
            {filteredMangas.length} {filteredMangas.length === 1 ? 'título encontrado' : 'títulos encontrados'}
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, autor ou gênero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card border-border/40 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-glow">Filtros</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Type Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Tipo</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-card border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Manhwa">Manhwa</SelectItem>
                      <SelectItem value="Manhua">Manhua</SelectItem>
                      <SelectItem value="Mangá">Mangá</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-card border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Completo">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Genre Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Gêneros</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {genres.map(genre => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={genre}
                          checked={selectedGenres.includes(genre)}
                          onCheckedChange={() => toggleGenre(genre)}
                          className="border-primary data-[state=checked]:bg-primary"
                        />
                        <label
                          htmlFor={genre}
                          className="text-sm cursor-pointer hover:text-primary transition-colors"
                        >
                          {genre}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedType !== "all" || selectedStatus !== "all" || selectedGenres.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Exibindo {filteredMangas.length} resultados
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-card border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Mais Popular</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="recent">Mais Recente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manga Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredMangas.map((manga, index) => (
                <div 
                  key={manga.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MangaCard {...manga} />
                </div>
              ))}
            </div>

            {filteredMangas.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">Nenhum título encontrado com esses filtros</p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
