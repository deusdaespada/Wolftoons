import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Eye } from "lucide-react";

export interface MangaCardProps {
  id: string;
  title: string;
  cover: string;
  type: string;
  rating: number;
  chapters?: number;
  status: "Completo" | "Em andamento";
  genres: string[];
  views: number;
  slug?: string | null;
}

const MangaCard = ({ id, title, cover, type, rating, chapters, status, genres, views, slug }: MangaCardProps) => {
  return (
    <Link 
      to={`/manga/${slug || id}`}
      className="group relative overflow-hidden rounded-xl bg-card border border-border/40 hover-lift hover-glow transition-all duration-300"
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img 
          src={cover} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Type Badge */}
        <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0 text-[10px] md:text-xs">
          {type}
        </Badge>
        
        {/* Views Badge */}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
          <Eye className="h-3 w-3 text-primary" />
          <span className="text-[10px] md:text-xs font-medium">
            {views >= 1000000 
              ? `${(views / 1000000).toFixed(1)}M` 
              : views >= 1000 
              ? `${(views / 1000).toFixed(1)}K` 
              : views}
          </span>
        </div>

        {/* Hover Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between text-[10px] md:text-xs text-foreground/80">
            {chapters !== undefined && (
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>{chapters} caps</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 md:p-3">
        <h3 className="font-display font-semibold text-xs md:text-sm line-clamp-2 mb-1.5 md:mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex flex-wrap gap-1">
          {genres.slice(0, 2).map((genre) => (
            <span 
              key={genre}
              className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default MangaCard;
