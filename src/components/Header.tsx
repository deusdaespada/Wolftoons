import { Link } from "react-router-dom";
import { Search, Menu, User, Shield, Plus, Download, BookMarked, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserDropdown from "@/components/UserDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <span className="text-2xl">🐺</span>
          <div className="text-2xl font-display font-semibold text-foreground">
            Wolftoon
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Início
          </Link>
          <Link to="/catalog" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Catálogo
          </Link>
          {user && (
            <Link to="/my-list" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
              <BookMarked className="h-4 w-4" />
              Minha Lista
            </Link>
          )}
          <Link to="/ranking" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Ranking
          </Link>
          <Link to="/vip" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors">
            ⭐ VIP
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <Link to="/admin/create-comic" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Criar Comic
              </Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 hover:text-primary">
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          
          {/* Discord Link */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild 
            className="hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
          >
            <a href="https://discord.gg/6wUg8wssQv" target="_blank" rel="noopener noreferrer">
              <DiscordIcon className="h-5 w-5" />
            </a>
          </Button>
          
          {user ? (
            <>
              <NotificationDropdown />
              <UserDropdown />
            </>
          ) : (
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 hover:text-primary">
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur">
          <nav className="container mx-auto flex flex-col space-y-3 px-4 py-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              to="/catalog" 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </Link>
            <Link 
              to="/vip" 
              className="text-sm font-medium text-primary hover:text-primary-glow transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              ⭐ VIP
            </Link>
            {user && (
              <Link 
                to="/my-list" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookMarked className="h-4 w-4" />
                Minha Lista
              </Link>
            )}
            <Link 
              to="/install" 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
              onClick={() => setIsMenuOpen(false)}
            >
              <Download className="h-4 w-4" />
              Instalar App
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
