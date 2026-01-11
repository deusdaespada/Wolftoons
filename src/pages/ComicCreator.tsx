import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCreateTitle, useTitles, useUpdateTitle } from '@/hooks/useTitles';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, X, BookOpen, Sparkles, Image as ImageIcon, Eye, ArrowLeft, Edit, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/slugify';

const GENRE_OPTIONS = [
  'Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 
  'Romance', 'Terror', 'Mistério', 'Sci-Fi', 'Slice of Life',
  'Sobrenatural', 'Esportes', 'Escolar', 'Artes Marciais', 'Isekai'
];

const ComicCreator = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: titles } = useTitles();
  const createTitle = useCreateTitle();
  const updateTitle = useUpdateTitle();

  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [alternativeTitleInput, setAlternativeTitleInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    alternative_titles: [] as string[],
    cover: '',
    type: 'Manhwa' as 'Manhwa' | 'Manhua' | 'Mangá' | 'Webtoon' | 'HQ' | 'Doujinshi' | 'One-shot',
    rating: 0,
    status: 'Em andamento' as 'Completo' | 'Em andamento',
    genres: [] as string[],
    synopsis: '',
    author: '',
    year: new Date().getFullYear(),
    views: 0,
    slug: null as string | null,
  });

  // Load existing comic data for editing
  useEffect(() => {
    if (isEditMode && titles) {
      const existingTitle = titles.find(t => t.id === editId);
      if (existingTitle) {
        setFormData({
          title: existingTitle.title,
          alternative_titles: existingTitle.alternative_titles || [],
          cover: existingTitle.cover,
          type: existingTitle.type as 'Manhwa' | 'Manhua' | 'Mangá' | 'Webtoon' | 'HQ' | 'Doujinshi' | 'One-shot',
          rating: existingTitle.rating || 0,
          status: existingTitle.status as 'Completo' | 'Em andamento',
          genres: existingTitle.genres || [],
          synopsis: existingTitle.synopsis,
          author: existingTitle.author,
          year: existingTitle.year,
          views: existingTitle.views || 0,
          slug: existingTitle.slug,
        });
      }
    }
  }, [isEditMode, editId, titles]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa ser administrador para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setFormData({ ...formData, cover: publicUrl });
      
      toast({
        title: 'Capa enviada!',
        description: 'A imagem foi carregada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar imagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (formData.genres.includes(genre)) {
      setFormData({ ...formData, genres: formData.genres.filter(g => g !== genre) });
    } else {
      setFormData({ ...formData, genres: [...formData.genres, genre] });
    }
  };

  const addAlternativeTitle = () => {
    const trimmed = alternativeTitleInput.trim();
    if (trimmed && !formData.alternative_titles.includes(trimmed)) {
      setFormData({ 
        ...formData, 
        alternative_titles: [...formData.alternative_titles, trimmed] 
      });
      setAlternativeTitleInput('');
    }
  };

  const removeAlternativeTitle = (title: string) => {
    setFormData({
      ...formData,
      alternative_titles: formData.alternative_titles.filter(t => t !== title)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.cover || !formData.author || !formData.synopsis) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditMode && editId) {
        await updateTitle.mutateAsync({ id: editId, ...formData });
        toast({
          title: 'Comic atualizada!',
          description: 'Suas alterações foram salvas.',
        });
      } else {
        await createTitle.mutateAsync(formData);
        toast({
          title: 'Comic criada!',
          description: 'Sua comic foi adicionada com sucesso.',
        });
      }
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              {isEditMode ? <Edit className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {isEditMode ? 'Editar Comic' : 'Criar Nova Comic'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? 'Atualize os dados da comic' : 'Adicione um novo manhwa, manhua ou mangá'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Cover and Preview */}
            <div className="space-y-6">
              {/* Cover Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Capa
                  </CardTitle>
                  <CardDescription>Envie a imagem de capa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.cover ? (
                      <div className="relative group">
                        <img 
                          src={formData.cover} 
                          alt="Preview" 
                          className="w-full aspect-[2/3] object-cover rounded-lg border border-border"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x300?text=Erro';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setFormData({ ...formData, cover: '' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label 
                        htmlFor="cover-upload" 
                        className="flex flex-col items-center justify-center w-full aspect-[2/3] border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground text-center px-4">
                          {isUploadingCover ? 'Enviando...' : 'Clique para enviar a capa'}
                        </span>
                        <Input
                          type="file"
                          accept="image/*,.avif"
                          onChange={handleCoverUpload}
                          className="hidden"
                          id="cover-upload"
                          disabled={isUploadingCover}
                        />
                      </label>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Ou cole uma URL:</Label>
                      <Input
                        value={formData.cover}
                        onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Preview em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="relative aspect-[2/3]">
                      {formData.cover ? (
                        <img 
                          src={formData.cover} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {formData.rating > 0 && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                          ⭐ {formData.rating.toFixed(1)}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <Badge variant="secondary" className="text-xs mb-1">
                          {formData.type || 'Tipo'}
                        </Badge>
                        <h3 className="text-white font-bold text-sm line-clamp-2">
                          {formData.title || 'Título da Comic'}
                        </h3>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {formData.author || 'Autor'} • {formData.year} • {formData.status}
                      </p>
                      {formData.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {formData.genres.slice(0, 3).map((genre) => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                          {formData.genres.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{formData.genres.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {formData.synopsis || 'Sinopse da comic aparecerá aqui...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Informações
                  </CardTitle>
                  <CardDescription>Dados principais da comic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          const autoSlug = generateSlug(newTitle);
                          setFormData({ 
                            ...formData, 
                            title: newTitle,
                            slug: formData.slug || autoSlug || null
                          });
                        }}
                        placeholder="Nome da comic"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          value={formData.slug || ''}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value || null })}
                          placeholder="nome-da-comic"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
                          title="Gerar slug automaticamente"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">URL: /manga/{formData.slug || 'slug-aqui'}</p>
                    </div>

                    {/* Alternative Titles */}
                    <div className="md:col-span-2 space-y-2">
                      <Label>Títulos Alternativos</Label>
                      <div className="flex gap-2">
                        <Input
                          value={alternativeTitleInput}
                          onChange={(e) => setAlternativeTitleInput(e.target.value)}
                          placeholder="Ex: Solo Leveling, 나 혼자만 레벨업"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addAlternativeTitle();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addAlternativeTitle}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.alternative_titles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.alternative_titles.map((alt, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                              {alt}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                onClick={() => removeAlternativeTitle(alt)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Nomes em outros idiomas ou títulos conhecidos da obra
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author">Autor *</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Nome do autor"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: 'Manhwa' | 'Manhua' | 'Mangá' | 'Webtoon' | 'HQ' | 'Doujinshi' | 'One-shot') => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manhwa">Manhwa (Coreano)</SelectItem>
                          <SelectItem value="Manhua">Manhua (Chinês)</SelectItem>
                          <SelectItem value="Mangá">Mangá (Japonês)</SelectItem>
                          <SelectItem value="Webtoon">Webtoon</SelectItem>
                          <SelectItem value="HQ">HQ (Quadrinhos)</SelectItem>
                          <SelectItem value="Doujinshi">Doujinshi</SelectItem>
                          <SelectItem value="One-shot">One-shot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: 'Completo' | 'Em andamento') => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em andamento">Em andamento</SelectItem>
                          <SelectItem value="Completo">Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Ano</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating">Avaliação (0-10)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="synopsis">Sinopse *</Label>
                    <Textarea
                      id="synopsis"
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      placeholder="Descreva a história..."
                      rows={4}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Genres Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Gêneros</CardTitle>
                  <CardDescription>Selecione os gêneros que se aplicam</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                      <Badge
                        key={genre}
                        variant={formData.genres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer transition-colors hover:bg-primary/80"
                        onClick={() => toggleGenre(genre)}
                      >
                        {formData.genres.includes(genre) && <Plus className="h-3 w-3 mr-1 rotate-45" />}
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  {formData.genres.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Selecionados: {formData.genres.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Separator />
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTitle.isPending || updateTitle.isPending}>
                  {createTitle.isPending || updateTitle.isPending 
                    ? 'Salvando...' 
                    : isEditMode ? 'Salvar Alterações' : 'Criar Comic'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComicCreator;
