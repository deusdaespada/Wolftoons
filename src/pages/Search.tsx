import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MangaCard from "@/components/MangaCard";
import { useTitles } from "@/hooks/useTitles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, Filter } from "lucide-react";

const Search = () => {
  const { data: titles, isLoading } = useTitles();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchResults, setSearchResults] = useState(titles || []);

  // Get unique genres from all titles
  const allGenres = Array.from(new Set(titles?.flatMap(t => t.genres) || [])).sort();

  useEffect(() => {
    if (!titles) return;
    
    let filtered = titles;

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(manga => 
        manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(manga => manga.genres.includes(selectedGenre));
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(manga => manga.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(manga => manga.status === selectedStatus);
    }

    setSearchResults(filtered);
  }, [titles, searchQuery, selectedGenre, selectedType, selectedStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="font-display text-4xl font-semibold mb-4 text-center">
            Busca
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Encontre seu próximo manhwa, manhua ou mangá favorito
          </p>

          {/* Search Bar */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, autor ou gênero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-card border-border/40 text-lg focus:border-primary"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Gênero
              </label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-card border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Gêneros</SelectItem>
                  {allGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Tipo
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-card border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Manhwa">Manhwa</SelectItem>
                  <SelectItem value="Manhua">Manhua</SelectItem>
                  <SelectItem value="Mangá">Mangá</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-card border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Completo">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">
            {searchQuery 
              ? `${searchResults.length} ${searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'} para "${searchQuery}"`
              : `Todos os títulos (${searchResults.length})`
            }
          </h2>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {searchResults.map((manga, index) => (
              <div 
                key={manga.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MangaCard {...manga} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-display text-2xl font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Tente buscar com outros termos ou explore nosso catálogo completo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("all");
                setSelectedType("all");
                setSelectedStatus("all");
              }}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
