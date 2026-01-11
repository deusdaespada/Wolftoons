import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Clock, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChapterInfo {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  created_at: string;
}

interface TitleWithChapters {
  id: string;
  title: string;
  cover: string;
  type: string;
  chapters: ChapterInfo[];
  totalChapters: number;
  latestUpdate: string;
  newChaptersCount: number;
}

interface RecentUpdatesSectionProps {
  groupedChapters: TitleWithChapters[];
}

const RecentUpdatesSection = ({ groupedChapters }: RecentUpdatesSectionProps) => {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const INITIAL_CHAPTERS = 4;

  const toggleExpand = (titleId: string) => {
    setExpandedTitles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(titleId)) {
        newSet.delete(titleId);
      } else {
        newSet.add(titleId);
      }
      return newSet;
    });
  };

  if (!groupedChapters || groupedChapters.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Zap className="h-6 w-6 text-primary fill-primary" />
          <h2 className="font-display text-3xl font-semibold">Atualizações Recentes</h2>
        </div>
        <Button variant="ghost" className="text-primary hover:text-primary-glow" asChild>
          <Link to="/catalog">
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="space-y-4">
        {groupedChapters.map((item, index) => {
          const isExpanded = expandedTitles.has(item.id);
          const displayedChapters = isExpanded ? item.chapters : item.chapters.slice(0, INITIAL_CHAPTERS);
          const remainingCount = item.totalChapters - INITIAL_CHAPTERS;

          return (
            <div 
              key={item.id}
              className="animate-fade-in bg-card border border-border/40 rounded-xl overflow-hidden hover:border-primary/30 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-4 p-4">
                {/* Cover Image */}
                <Link to={`/manga/${item.id}`} className="shrink-0">
                  <img 
                    src={item.cover} 
                    alt={item.title}
                    className="w-20 h-28 md:w-24 md:h-32 object-cover rounded-lg hover:scale-105 transition-transform"
                  />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title and Time */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <Link to={`/manga/${item.id}`}>
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(item.latestUpdate), { 
                          addSuffix: false, 
                          locale: ptBR 
                        })}
                      </span>
                      <span className="text-primary font-medium">
                        • {item.newChaptersCount} {item.newChaptersCount === 1 ? 'capítulo novo' : 'capítulos novos'}
                      </span>
                    </div>
                  </div>

                  {/* Chapters Grid */}
                  <div className="flex flex-wrap gap-2">
                    {displayedChapters.map((chapter, chapterIndex) => {
                      const isNew = chapterIndex < item.newChaptersCount;
                      return (
                        <Link
                          key={chapter.id}
                          to={`/read/${item.id}/${chapter.chapter_number}`}
                          className={`
                            relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium
                            transition-all hover:scale-105
                            ${isNew 
                              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' 
                              : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted'
                            }
                          `}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Cap. {chapter.chapter_number}
                          {isNew && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Expand Button */}
                  {remainingCount > 0 && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          +{remainingCount} capítulos
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentUpdatesSection;