import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTitles } from '@/hooks/useTitles';
import { useCreateChapter } from '@/hooks/useChapters';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, GripVertical, Image as ImageIcon, ArrowLeft, Layers, FolderOpen, FileText, FileUp, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import mammoth from 'mammoth';
import RichTextEditor from '@/components/RichTextEditor';
const ChapterUpload = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: titles } = useTitles();
  const createChapter = useCreateChapter();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const preselectedTitleId = searchParams.get('titleId') || '';

  const [formData, setFormData] = useState({
    title_id: preselectedTitleId,
    chapter_number: 0,
    chapter_title: '',
    images: [] as string[],
    content: '',
    content_type: 'images' as 'images' | 'novel',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isImportingText, setIsImportingText] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

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

  const extractNumbers = (filename: string): number => {
    const matches = filename.match(/\d+/g);
    return matches ? parseInt(matches[matches.length - 1]) : 0;
  };

  const getContentType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const types: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'avif': 'image/avif',
    };
    return types[ext || ''] || 'image/jpeg';
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setIsProcessing(true);

    const files = Array.from(e.dataTransfer.files);
    await processImageFiles(files);
    setIsProcessing(false);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setIsProcessing(true);
    await processImageFiles(files);
    setIsProcessing(false);
  };

  const processImageFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file.name));
    
    if (imageFiles.length === 0) {
      toast({
        title: 'Nenhuma imagem encontrada',
        description: 'Selecione arquivos de imagem (JPG, PNG, WEBP, GIF)',
        variant: 'destructive',
      });
      return;
    }

    const imageUrls: { url: string; order: number }[] = [];
    setUploadProgress(0);

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const contentType = getContentType(file.name);

      const { error: uploadError } = await supabase.storage
        .from('chapters')
        .upload(fileName, file, {
          contentType: contentType,
          cacheControl: '3600',
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('chapters')
          .getPublicUrl(fileName);

        imageUrls.push({ url: publicUrl, order: extractNumbers(file.name) });
      } else {
        console.error('Upload error:', uploadError);
      }

      setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
    }

    const sortedUrls = imageUrls.sort((a, b) => a.order - b.order).map(i => i.url);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...sortedUrls] }));
    setUploadProgress(0);

    toast({
      title: 'Imagens enviadas!',
      description: `${sortedUrls.length} imagens adicionadas com sucesso.`,
    });
  };

  const handleTextFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingText(true);

    try {
      const fileName = file.name.toLowerCase();
      let text = '';

      if (fileName.endsWith('.txt')) {
        // Read .txt file
        text = await file.text();
      } else if (fileName.endsWith('.docx')) {
        // Read .docx file using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        toast({
          title: 'Formato não suportado',
          description: 'Use arquivos .txt ou .docx',
          variant: 'destructive',
        });
        return;
      }

      setFormData(prev => ({ ...prev, content: text, content_type: 'novel' }));
      
      toast({
        title: 'Texto importado!',
        description: `Arquivo "${file.name}" carregado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao importar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImportingText(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...formData.images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setFormData(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um título.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.content_type === 'images' && formData.images.length === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Adicione pelo menos uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.content_type === 'novel' && !formData.content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Adicione o conteúdo de texto da novel.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const chapterData = {
        title_id: formData.title_id,
        chapter_number: formData.chapter_number,
        chapter_title: formData.chapter_title,
        images: formData.content_type === 'images' ? formData.images : [],
        content: formData.content_type === 'novel' ? formData.content : null,
        content_type: formData.content_type,
      };
      
      await createChapter.mutateAsync(chapterData);
      toast({
        title: 'Capítulo criado!',
        description: 'O capítulo foi adicionado com sucesso.',
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const selectedTitle = titles?.find(t => t.id === formData.title_id);

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
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Upload de Capítulo</h1>
              <p className="text-muted-foreground">Arraste imagens ou selecione uma pasta</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Dados do capítulo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Select
                    value={formData.title_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, title_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o título" />
                    </SelectTrigger>
                    <SelectContent>
                      {titles?.map((title) => (
                        <SelectItem key={title.id} value={title.id}>
                          {title.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número do Capítulo *</Label>
                  <Input
                    type="number"
                    value={formData.chapter_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, chapter_number: parseInt(e.target.value) ?? 0 }))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Título do Capítulo (opcional)</Label>
                  <Input
                    value={formData.chapter_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, chapter_title: e.target.value }))}
                    placeholder="Ex: O Início da Aventura"
                  />
                </div>

                {selectedTitle && (
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Título selecionado:</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedTitle.cover}
                        alt={selectedTitle.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{selectedTitle.title}</p>
                        <p className="text-xs text-muted-foreground">{selectedTitle.type}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={createChapter.isPending}>
                    {createChapter.isPending ? 'Salvando...' : 'Criar Capítulo'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Content */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conteúdo do Capítulo</CardTitle>
                <CardDescription>Escolha o tipo de conteúdo</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={formData.content_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v as 'images' | 'novel' }))}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="images" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imagens (Mangá/Manhwa)
                    </TabsTrigger>
                    <TabsTrigger value="novel" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Novel (Texto)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="images">
                    {/* Drop Zone */}
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
                        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {isProcessing ? `Enviando... ${uploadProgress}%` : 'Arraste imagens aqui'}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Suporta JPG, PNG, WEBP e GIF
                      </p>
                      
                      <div className="flex flex-wrap justify-center gap-3">
                        <Input
                          type="file"
                          accept="image/*,.avif"
                          multiple
                          onChange={handleFileInput}
                          className="hidden"
                          id="file-upload"
                        />
                        <Label htmlFor="file-upload">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Selecionar Imagens
                            </span>
                          </Button>
                        </Label>

                        <input
                          type="file"
                          accept="image/*,.avif"
                          multiple
                          // @ts-ignore - webkitdirectory is not in types but works
                          webkitdirectory=""
                          onChange={handleFileInput}
                          className="hidden"
                          ref={folderInputRef}
                          id="folder-upload"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => folderInputRef.current?.click()}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Selecionar Pasta
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {isProcessing && uploadProgress > 0 && (
                      <div className="mb-6">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Preview Grid */}
                    {formData.images.length > 0 && (
                      <ScrollArea className="h-[400px]">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {formData.images.map((url, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={() => handleImageDragStart(index)}
                              onDragOver={(e) => handleImageDragOver(e, index)}
                              onDragEnd={handleImageDragEnd}
                              className={`
                                relative group aspect-[2/3] rounded-lg overflow-hidden border border-border
                                cursor-grab active:cursor-grabbing
                                ${draggedIndex === index ? 'opacity-50' : ''}
                              `}
                            >
                              <img
                                src={url}
                                alt={`Página ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <GripVertical className="h-5 w-5 text-white" />
                                <span className="text-white font-bold">{index + 1}</span>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {formData.images.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma imagem adicionada ainda
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="novel">
                    {/* Text Import Zone */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center bg-purple-500/5">
                        <FileUp className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                        <p className="text-lg font-medium mb-2">Importar arquivo de texto</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Suporta arquivos .txt e .docx
                        </p>
                        
                        <Input
                          type="file"
                          accept=".txt,.docx"
                          onChange={handleTextFileImport}
                          className="hidden"
                          id="text-file-upload"
                          disabled={isImportingText}
                        />
                        <Label htmlFor="text-file-upload">
                          <Button 
                            type="button" 
                            variant="outline" 
                            asChild
                            className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                          >
                            <span>
                              <FileText className="h-4 w-4 mr-2" />
                              {isImportingText ? 'Importando...' : 'Selecionar Arquivo'}
                            </span>
                          </Button>
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Conteúdo do Capítulo</Label>
                          <span className="text-xs text-muted-foreground">
                            {formData.content.length.toLocaleString()} caracteres
                          </span>
                        </div>
                        <RichTextEditor
                          value={formData.content}
                          onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                          placeholder="Cole ou digite o texto do capítulo aqui..."
                          rows={16}
                        />
                      </div>

                      {formData.content && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Preview</h4>
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={() => setIsFullscreenPreview(true)}
                              className="flex items-center gap-2"
                            >
                              <Maximize2 className="h-4 w-4" />
                              Tela Cheia
                            </Button>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-h-48 overflow-y-auto">
                            <div 
                              className="whitespace-pre-wrap text-sm"
                              dangerouslySetInnerHTML={{ 
                                __html: formData.content
                                  .slice(0, 500)
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold">$1</h1>')
                                  .replace(/^## (.*?)$/gm, '<h2 class="text-base font-semibold">$1</h2>')
                                  .replace(/^> (.*?)$/gm, '<blockquote class="border-l-2 border-primary pl-2 italic">$1</blockquote>')
                                  + (formData.content.length > 500 ? '...' : '')
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Fullscreen Preview Dialog */}
                      <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-purple-500" />
                              Preview do Capítulo
                              {formData.chapter_title && ` - ${formData.chapter_title}`}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-1 pr-4">
                            <div className="prose prose-lg dark:prose-invert max-w-none py-4">
                              <div 
                                className="whitespace-pre-wrap leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                  __html: formData.content
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
                                    .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
                                    .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                                    .replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-3 italic bg-purple-500/5 rounded-r">$1</blockquote>')
                                    .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
                                    .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
                                    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
                                }}
                              />
                            </div>
                          </ScrollArea>
                          <div className="pt-4 border-t border-border flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {formData.content.length.toLocaleString()} caracteres
                            </span>
                            <Button variant="outline" onClick={() => setIsFullscreenPreview(false)}>
                              Fechar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChapterUpload;
