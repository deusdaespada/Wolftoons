import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, SortOrder } from '@/hooks/useComments';
import { useReportComment } from '@/hooks/useCommentReports';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Trash2, User, AlertTriangle, Eye, ChevronDown, Send, Heart, Reply, ChevronUp, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentsSectionProps {
  titleId?: string;
  chapterId?: string;
}

const MAX_COMMENT_LENGTH = 1000;

const CommentsSection = ({ titleId, chapterId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { comments, isLoading, addComment, deleteComment, toggleLike, isAddingComment } = useComments(titleId, chapterId);
  const reportComment = useReportComment();
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  
  const remainingChars = MAX_COMMENT_LENGTH - newComment.length;
  const isOverLimit = remainingChars < 0;
  const replyRemainingChars = MAX_COMMENT_LENGTH - replyContent.length;
  const isReplyOverLimit = replyRemainingChars < 0;

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [comments, sortOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isOverLimit) return;
    
    addComment({ content: newComment, titleId, chapterId, isSpoiler });
    setNewComment('');
    setIsSpoiler(false);
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyContent.trim() || isReplyOverLimit) return;
    
    addComment({ content: replyContent, titleId, chapterId, isSpoiler: replySpoiler, parentId });
    setReplyContent('');
    setReplySpoiler(false);
    setReplyingTo(null);
    setExpandedReplies(prev => new Set([...prev, parentId]));
  };

  const toggleSpoilerReveal = (commentId: string) => {
    setRevealedSpoilers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleRepliesExpand = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const openReportDialog = (commentId: string) => {
    setReportingCommentId(commentId);
    setReportReason('');
    setReportDialogOpen(true);
  };

  const handleReport = async () => {
    if (!reportingCommentId || !reportReason.trim()) return;
    
    try {
      await reportComment.mutateAsync({ 
        commentId: reportingCommentId, 
        reason: reportReason 
      });
      toast({
        title: 'Denúncia enviada',
        description: 'Obrigado por reportar. Nossa equipe irá analisar.',
      });
      setReportDialogOpen(false);
      setReportingCommentId(null);
      setReportReason('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderComment = (comment: (typeof comments)[number], isReply = false) => {
    const isSpoilerHidden = comment.is_spoiler && !revealedSpoilers.has(comment.id);
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-zinc-700 pl-3' : ''}`}>
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.avatar_url || undefined} />
              <AvatarFallback className="bg-zinc-600">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white text-sm">
                  {comment.username || 'Usuário'}
                </span>
                {comment.is_spoiler && (
                  <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Spoiler
                  </span>
                )}
                <span className="text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
              
              {/* Comment content with spoiler blur */}
              <div className="mt-1 relative">
                {isSpoilerHidden ? (
                  <div 
                    className="bg-zinc-700/50 rounded p-2 cursor-pointer flex items-center justify-center gap-2 text-zinc-400 hover:bg-zinc-700 transition-colors"
                    onClick={() => toggleSpoilerReveal(comment.id)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Clique para revelar spoiler</span>
                  </div>
                ) : (
                  <p className="text-zinc-200 text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 mt-2">
                {/* Like button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs gap-1 ${comment.user_liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
                  onClick={() => user && toggleLike({ commentId: comment.id, isLiked: comment.user_liked || false })}
                  disabled={!user}
                >
                  <Heart className={`h-3.5 w-3.5 ${comment.user_liked ? 'fill-red-400' : ''}`} />
                  {(comment.likes_count || 0) > 0 && comment.likes_count}
                </Button>

                {/* Reply button (only for parent comments) */}
                {!isReply && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-500 hover:text-white gap-1"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Responder
                  </Button>
                )}

                {comment.is_spoiler && revealedSpoilers.has(comment.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={() => toggleSpoilerReveal(comment.id)}
                  >
                    Ocultar
                  </Button>
                )}

                {/* Report button */}
                {user && user.id !== comment.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-500 hover:text-amber-500 gap-1"
                    onClick={() => openReportDialog(comment.id)}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Denunciar
                  </Button>
                )}
                
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="ml-8 mt-2 space-y-2">
            <div className="relative">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={`min-h-[60px] bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 resize-none text-sm ${isReplyOverLimit ? 'border-red-500' : ''}`}
              />
              <span className={`absolute bottom-2 right-2 text-xs ${isReplyOverLimit ? 'text-red-500' : 'text-zinc-400'}`}>
                {replyContent.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white text-sm">
                <Checkbox 
                  checked={replySpoiler} 
                  onCheckedChange={(checked) => setReplySpoiler(checked === true)}
                  className="border-zinc-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 h-4 w-4"
                />
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span>Spoiler</span>
              </label>
              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => { setReplyingTo(null); setReplyContent(''); setReplySpoiler(false); }}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  disabled={!replyContent.trim() || isReplyOverLimit}
                  onClick={() => handleReplySubmit(comment.id)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  Responder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white gap-1 ml-8"
              onClick={() => toggleRepliesExpand(comment.id)}
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Ocultar {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Ver {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}
                </>
              )}
            </Button>
            
            {expandedReplies.has(comment.id) && (
              <div className="space-y-2 mt-2">
                {comment.replies?.map(reply => renderComment(reply as (typeof comments)[number], true))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Comentários</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-700 gap-1">
              {sortOrder === 'newest' ? 'Mais recentes' : 'Mais antigos'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
            <DropdownMenuItem 
              className={`cursor-pointer ${sortOrder === 'newest' ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
              onClick={() => setSortOrder('newest')}
            >
              Mais recentes
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`cursor-pointer ${sortOrder === 'oldest' ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
              onClick={() => setSortOrder('oldest')}
            >
              Mais antigos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`min-h-[80px] bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 resize-none ${isOverLimit ? 'border-red-500' : ''}`}
            />
            <span className={`absolute bottom-2 right-2 text-xs ${isOverLimit ? 'text-red-500' : 'text-zinc-400'}`}>
              {newComment.length}/{MAX_COMMENT_LENGTH}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
              <Checkbox 
                checked={isSpoiler} 
                onCheckedChange={(checked) => setIsSpoiler(checked === true)}
                className="border-zinc-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Spoiler</span>
            </label>
            
            <Button 
              type="submit" 
              disabled={!newComment.trim() || isAddingComment || isOverLimit}
              className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
            >
              <Send className="h-4 w-4" />
              Comentar
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-700/50 border border-zinc-600 rounded-lg p-4 text-center">
          <p className="text-zinc-400 mb-2">Faça login para comentar</p>
          <Button asChild variant="outline" className="border-zinc-500 text-white hover:bg-zinc-600">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <p className="text-zinc-400 text-center py-4">Carregando comentários...</p>
      ) : sortedComments.length === 0 ? (
        <p className="text-amber-500/80 text-center py-6 italic">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-3">
          {sortedComments.map(comment => renderComment(comment as typeof comments[0]))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Denunciar Comentário</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Descreva o motivo da denúncia. Nossa equipe irá analisar.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Conteúdo ofensivo, spam, discurso de ódio..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReportDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason.trim() || reportComment.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {reportComment.isPending ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentsSection;
