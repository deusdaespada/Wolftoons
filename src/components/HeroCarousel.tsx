import { useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Title } from "@/hooks/useTitles";
import Autoplay from "embla-carousel-autoplay";
import { Flame, Sparkles } from "lucide-react";

interface HeroCarouselProps {
  titles: Title[];
}

const HeroCarousel = ({ titles }: HeroCarouselProps) => {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );
  
  const featuredTitles = titles.slice(0, 5);

  if (featuredTitles.length === 0) return null;

  return (
    <section className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {featuredTitles.map((title, index) => (
            <CarouselItem key={title.id} className="pl-0 md:basis-1/2 lg:basis-1/3">
              <Link
                to={`/manga/${title.slug || title.id}`}
                className="relative block aspect-[3/4] overflow-hidden rounded-lg group"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={title.cover}
                    alt={title.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                  {/* Type Badge */}
                  <Badge 
                    className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 text-xs font-medium"
                  >
                    {title.type}
                  </Badge>

                  {/* Hot/New Badge */}
                  {index === 0 && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs font-medium flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      Hot
                    </Badge>
                  )}
                  {index === 1 && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground border-0 text-xs font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      New
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {title.title}
                  </h3>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5">
                    {title.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default HeroCarousel;
