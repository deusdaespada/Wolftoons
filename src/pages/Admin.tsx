import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateTitle, useTitles, useDeleteTitle } from '@/hooks/useTitles';
import { useCreateChapter, useChapters, useDeleteChapter, useUpdateChapterVip } from '@/hooks/useChapters';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Trash2, Plus, Upload, BarChart3, Users, Search, Edit, Layers, Crown, FileText, Flag, Shield } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import VipManagement from '@/components/admin/VipManagement';
import CommentReports from '@/components/admin/CommentReports';
import UserManagement from '@/components/admin/UserManagement';
import AdminActionsHistory from '@/components/admin/AdminActionsHistory';
import BlockedAccessLogs from '@/components/admin/BlockedAccessLogs';
import BlockedIpsManagement from '@/components/admin/BlockedIpsManagement';
import WhitelistManagement from '@/components/admin/WhitelistManagement';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import { Switch } from '@/components/ui/switch';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: titles } = useTitles();
  const createTitle = useCreateTitle();
  const createChapter = useCreateChapter();
  const deleteTitle = useDeleteTitle();

  const [newTitle, setNewTitle] = useState({
    title: '',
    cover: '',
    type: 'Manhwa' as 'Manhwa' | 'Manhua' | 'Mangá',
    rating: 0,
    status: 'Em andamento' as 'Completo' | 'Em andamento',
    genres: [] as string[],
    synopsis: '',
    author: '',
    year: new Date().getFullYear(),
    views: 0,
    slug: null as string | null,
  });

  const [newChapter, setNewChapter] = useState({
    title_id: '',
    chapter_number: 1,
    chapter_title: '',
    images: [] as string[],
  });

  const [genreInput, setGenreInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [manageSearch, setManageSearch] = useState('');
  const [chapterTitleSearch, setChapterTitleSearch] = useState('');
  const [selectedTitleForChapters, setSelectedTitleForChapters] = useState<string | null>(null);
  const { data: analyticsData } = useAnalytics(analyticsPeriod);
  const { data: adminStats } = useAdminStats();
  const { data: chaptersForSelected } = useChapters(newChapter.title_id);
  const { data: chaptersForManage } = useChapters(selectedTitleForChapters || '');
  const deleteChapter = useDeleteChapter();
  const updateChapterVip = useUpdateChapterVip();

  const filteredTitles = useMemo(() => {
    if (!titles) return [];
    if (!manageSearch.trim()) return titles;
    const search = manageSearch.toLowerCase();
    return titles.filter(title => 
      title.title.toLowerCase().includes(search) ||
      title.author.toLowerCase().includes(search)
    );
  }, [titles, manageSearch]);

  const filteredTitlesForChapter = useMemo(() => {
    if (!titles) return [];
    if (!chapterTitleSearch.trim()) return titles;
    const search = chapterTitleSearch.toLowerCase();
    return titles.filter(title => 
      title.title.toLowerCase().includes(search)
    );
  }, [titles, chapterTitleSearch]);

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

  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTitle.mutateAsync(newTitle);
      toast({
        title: 'Título criado!',
        description: 'O título foi adicionado com sucesso.',
      });
      setNewTitle({
        title: '',
        cover: '',
        type: 'Manhwa',
        rating: 0,
        status: 'Em andamento',
        genres: [],
        synopsis: '',
        author: '',
        year: new Date().getFullYear(),
        views: 0,
        slug: null,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChapter.mutateAsync(newChapter);
      toast({
        title: 'Capítulo criado!',
        description: 'O capítulo foi adicionado com sucesso.',
      });
      setNewChapter({
        title_id: '',
        chapter_number: 1,
        chapter_title: '',
        images: [],
      });
      setImageInput('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTitle = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este título?')) {
      try {
        await deleteTitle.mutateAsync(id);
        toast({
          title: 'Título excluído!',
          description: 'O título foi removido com sucesso.',
        });
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const addGenre = () => {
    if (genreInput && !newTitle.genres.includes(genreInput)) {
      setNewTitle({ ...newTitle, genres: [...newTitle.genres, genreInput] });
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setNewTitle({ ...newTitle, genres: newTitle.genres.filter(g => g !== genre) });
  };

  const addImage = () => {
    if (imageInput && !newChapter.images.includes(imageInput)) {
      setNewChapter({ ...newChapter, images: [...newChapter.images, imageInput] });
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setNewChapter({ ...newChapter, images: newChapter.images.filter((_, i) => i !== index) });
  };

  const extractNumbers = (filename: string): number[] => {
    const matches = filename.match(/\d+/g);
    return matches ? matches.map(n => parseInt(n)) : [0];
  };

  const getContentType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const types: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return types[ext || ''] || 'image/jpeg';
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingZip(true);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      const imageUrls: { url: string; order: number }[] = [];

      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
          const blob = await zipEntry.async('blob');
          const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const contentType = getContentType(filename);

          const { error: uploadError } = await supabase.storage
            .from('chapters')
            .upload(fileName, blob, {
              contentType: contentType,
              cacheControl: '3600',
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('chapters')
              .getPublicUrl(fileName);

            const numbers = extractNumbers(filename);
            imageUrls.push({ url: publicUrl, order: numbers[numbers.length - 1] || 0 });
          }
        }
      }

      const sortedUrls = imageUrls.sort((a, b) => a.order - b.order).map(i => i.url);
      setNewChapter({ ...newChapter, images: [...newChapter.images, ...sortedUrls] });

      toast({
        title: 'ZIP processado!',
        description: `${sortedUrls.length} imagens enviadas e ordenadas.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao processar ZIP',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingZip(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, titleId: string) => {
    if (confirm('Tem certeza que deseja excluir este capítulo?')) {
      try {
        await deleteChapter.mutateAsync({ id: chapterId, titleId });
        toast({
          title: 'Capítulo excluído!',
          description: 'O capítulo foi removido com sucesso.',
        });
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      setNewTitle({ ...newTitle, cover: publicUrl });
      
      toast({
        title: 'Imagem enviada!',
        description: 'A capa foi carregada com sucesso.',
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="font-display text-2xl md:text-4xl font-semibold">Painel Administrativo</h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/admin/batch-upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload em Lote
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/upload-chapter')}>
              <Layers className="h-4 w-4 mr-2" />
              Upload Capítulo
            </Button>
            <Button onClick={() => navigate('/admin/create-comic')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Comic
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/create-novel')} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500">
              <FileText className="h-4 w-4 mr-2" />
              Criar Novel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="titles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 mb-8 gap-2">
            <TabsTrigger value="titles" className="text-xs md:text-sm">Título</TabsTrigger>
            <TabsTrigger value="chapters" className="text-xs md:text-sm">Capítulo</TabsTrigger>
            <TabsTrigger value="manage" className="text-xs md:text-sm">Gerenciar</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="vip" className="text-xs md:text-sm">
              <Crown className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">VIP</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs md:text-sm">
              <Flag className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Denúncias</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              <Shield className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Título</CardTitle>
                <CardDescription>Preencha os dados do manhwa/manhua/mangá</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTitle} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={newTitle.title}
                        onChange={(e) => setNewTitle({ ...newTitle, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cover">Capa *</Label>
                      <div className="space-y-3">
                        {/* Image Upload */}
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                          <Input
                            type="file"
                            accept="image/*,.avif"
                            onChange={handleCoverUpload}
                            className="hidden"
                            id="cover-upload"
                            disabled={isUploadingCover}
                          />
                          <Label 
                            htmlFor="cover-upload" 
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {isUploadingCover ? 'Enviando...' : 'Clique para enviar imagem'}
                            </span>
                          </Label>
                        </div>
                        
                        {/* URL Input */}
                        <div className="relative">
                          <span className="text-xs text-muted-foreground mb-1 block">Ou cole uma URL:</span>
                          <Input
                            id="cover"
                            value={newTitle.cover}
                            onChange={(e) => setNewTitle({ ...newTitle, cover: e.target.value })}
                            placeholder="https://exemplo.com/capa.jpg"
                            required
                          />
                        </div>
                        
                        {/* Preview */}
                        {newTitle.cover && (
                          <div className="relative w-32 h-48 border border-border rounded overflow-hidden">
                            <img 
                              src={newTitle.cover} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/200x300?text=Erro';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select value={newTitle.type} onValueChange={(value: any) => setNewTitle({ ...newTitle, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manhwa">Manhwa</SelectItem>
                          <SelectItem value="Manhua">Manhua</SelectItem>
                          <SelectItem value="Mangá">Mangá</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={newTitle.status} onValueChange={(value: any) => setNewTitle({ ...newTitle, status: value })}>
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
                      <Label htmlFor="author">Autor *</Label>
                      <Input
                        id="author"
                        value={newTitle.author}
                        onChange={(e) => setNewTitle({ ...newTitle, author: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Ano *</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newTitle.year}
                        onChange={(e) => setNewTitle({ ...newTitle, year: parseInt(e.target.value) })}
                        required
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
                        value={newTitle.rating}
                        onChange={(e) => setNewTitle({ ...newTitle, rating: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="views">Visualizações</Label>
                      <Input
                        id="views"
                        type="number"
                        value={newTitle.views}
                        onChange={(e) => setNewTitle({ ...newTitle, views: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="synopsis">Sinopse *</Label>
                    <Textarea
                      id="synopsis"
                      value={newTitle.synopsis}
                      onChange={(e) => setNewTitle({ ...newTitle, synopsis: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gêneros</Label>
                    <div className="flex gap-2">
                      <Input
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        placeholder="Digite um gênero"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                      />
                      <Button type="button" onClick={addGenre}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newTitle.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                        >
                          {genre}
                          <button type="button" onClick={() => removeGenre(genre)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createTitle.isPending}>
                    {createTitle.isPending ? 'Criando...' : 'Criar Título'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chapters">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Capítulo</CardTitle>
                <CardDescription>Adicione páginas a um título existente</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChapter} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_id">Selecione o Título *</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar título..."
                        value={chapterTitleSearch}
                        onChange={(e) => setChapterTitleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={newChapter.title_id} onValueChange={(value) => setNewChapter({ ...newChapter, title_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um título" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTitlesForChapter?.map((title) => (
                          <SelectItem key={title.id} value={title.id}>
                            {title.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapter_number">Número do Capítulo *</Label>
                      <Input
                        id="chapter_number"
                        type="number"
                        value={newChapter.chapter_number}
                        onChange={(e) => setNewChapter({ ...newChapter, chapter_number: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chapter_title">Título do Capítulo</Label>
                      <Input
                        id="chapter_title"
                        value={newChapter.chapter_title}
                        onChange={(e) => setNewChapter({ ...newChapter, chapter_title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Imagens (URLs ou ZIP) *</Label>
                    
                    {/* ZIP Upload */}
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Input
                        type="file"
                        accept=".zip"
                        onChange={handleZipUpload}
                        className="hidden"
                        id="zip-upload"
                        disabled={isProcessingZip}
                      />
                      <Label 
                        htmlFor="zip-upload" 
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {isProcessingZip ? 'Processando ZIP...' : 'Clique para enviar ZIP com imagens'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Nomeie as imagens como: nome_1.jpg, nome_2.jpg, etc.
                        </span>
                      </Label>
                    </div>

                    {/* Manual URL Input */}
                    <div className="flex gap-2">
                      <Input
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        placeholder="Ou cole URL da imagem"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                      />
                      <Button type="button" onClick={addImage}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Image List */}
                    <div className="space-y-2 mt-2">
                      {newChapter.images.map((image, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="text-sm flex-1 truncate">{image}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createChapter.isPending}>
                    {createChapter.isPending ? 'Criando...' : 'Criar Capítulo'}
                  </Button>
                </form>

                {/* Chapter List for Selected Title */}
                {newChapter.title_id && chaptersForSelected && chaptersForSelected.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="font-semibold text-lg mb-4">
                      Capítulos de "{titles?.find(t => t.id === newChapter.title_id)?.title}"
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {chaptersForSelected.map((chapter) => (
                        <div key={chapter.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <span className="font-medium">Cap. {chapter.chapter_number}</span>
                            {chapter.chapter_title && (
                              <span className="text-muted-foreground ml-2">- {chapter.chapter_title}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({chapter.images.length} páginas)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChapter(chapter.id, chapter.title_id)}
                            disabled={deleteChapter.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Títulos</CardTitle>
                <CardDescription>Lista de todos os títulos cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou autor..."
                      value={manageSearch}
                      onChange={(e) => setManageSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {filteredTitles.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {manageSearch ? 'Nenhum título encontrado.' : 'Nenhum título cadastrado.'}
                      </p>
                    ) : (
                      filteredTitles.map((title) => (
                        <div key={title.id} className="space-y-2">
                          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <img 
                                src={title.cover} 
                                alt={title.title} 
                                className="w-12 h-16 object-cover rounded"
                              />
                              <div>
                                <h3 className="font-semibold">{title.title}</h3>
                                <p className="text-sm text-muted-foreground">{title.author} • {title.type} • {title.year}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTitleForChapters(
                                  selectedTitleForChapters === title.id ? null : title.id
                                )}
                              >
                                <Crown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/upload-chapter?titleId=${title.id}`)}
                              >
                                <Layers className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/create-comic?edit=${title.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTitle(title.id)}
                                disabled={deleteTitle.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Chapters VIP Management */}
                          {selectedTitleForChapters === title.id && chaptersForManage && chaptersForManage.length > 0 && (
                            <div className="ml-4 p-4 bg-card border border-border rounded-lg space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Crown className="h-4 w-4 text-primary" />
                                Gerenciar Capítulos VIP
                              </div>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {chaptersForManage.map((chapter) => (
                                  <div 
                                    key={chapter.id} 
                                    className="flex items-center justify-between p-2 bg-muted rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">Cap. {chapter.chapter_number}</span>
                                      {chapter.chapter_title && (
                                        <span className="text-muted-foreground text-sm">- {chapter.chapter_title}</span>
                                      )}
                                      {chapter.is_vip && (
                                        <Crown className="h-3 w-3 text-primary" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">VIP</span>
                                      <Switch
                                        checked={chapter.is_vip || false}
                                        onCheckedChange={(checked) => {
                                          updateChapterVip.mutate({ chapterId: chapter.id, isVip: checked });
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedTitleForChapters === title.id && (!chaptersForManage || chaptersForManage.length === 0) && (
                            <div className="ml-4 p-4 bg-card border border-border rounded-lg text-center text-muted-foreground text-sm">
                              Nenhum capítulo cadastrado
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="vip">
            <VipManagement />
          </TabsContent>

          <TabsContent value="reports">
            <CommentReports />
          </TabsContent>

          <TabsContent value="history">
            <AdminActionsHistory />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Visitantes</CardTitle>
                <CardDescription>Visualize quantas pessoas acessaram o site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Total Users Card */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-primary">
                            {adminStats?.totalUsers || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Usuários Cadastrados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={analyticsPeriod === 'day' ? 'default' : 'outline'}
                      onClick={() => setAnalyticsPeriod('day')}
                    >
                      Por Dia
                    </Button>
                    <Button
                      variant={analyticsPeriod === 'month' ? 'default' : 'outline'}
                      onClick={() => setAnalyticsPeriod('month')}
                    >
                      Por Mês
                    </Button>
                    <Button
                      variant={analyticsPeriod === 'year' ? 'default' : 'outline'}
                      onClick={() => setAnalyticsPeriod('year')}
                    >
                      Por Ano
                    </Button>
                  </div>

                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="visits" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Visitas"
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {analyticsData && analyticsData.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-primary">
                            {analyticsData.reduce((sum, item) => sum + item.visits, 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Total de Visitas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(analyticsData.reduce((sum, item) => sum + item.visits, 0) / analyticsData.length)}
                          </div>
                          <p className="text-xs text-muted-foreground">Média</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-primary">
                            {Math.max(...analyticsData.map(item => item.visits))}
                          </div>
                          <p className="text-xs text-muted-foreground">Pico</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityDashboard />
            <WhitelistManagement />
            <BlockedIpsManagement />
            <BlockedAccessLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;