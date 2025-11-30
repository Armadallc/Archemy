import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, MessageSquare, Loader2, User, Users, Search, Plus, Send, Pin, PinOff, Bell, BellOff, Trash2, CheckCheck, Reply, Copy, Forward, ThumbsUp, ThumbsDown, Heart, Laugh, AlertCircle, HelpCircle, Smile, MoreVertical } from 'lucide-react';
import { 
  useDiscussions, 
  useDiscussionMessages, 
  useCreateDiscussion, 
  useSendMessage,
  usePinDiscussion,
  useMuteDiscussion,
  useDeleteDiscussion,
  useMarkAsRead,
  useToggleReaction,
  type Discussion, 
  type DiscussionMessage 
} from '../../hooks/useDiscussions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger 
} from '../ui/context-menu';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

export default function ChatWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatParticipants, setNewChatParticipants] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch all discussions
  const { data: discussions = [], isLoading: discussionsLoading, error: discussionsError } = useDiscussions();
  
  // Hooks for creating discussions and sending messages
  const createDiscussion = useCreateDiscussion();
  const sendMessage = useSendMessage();
  const pinDiscussion = usePinDiscussion();
  const muteDiscussion = useMuteDiscussion();
  const deleteDiscussion = useDeleteDiscussion();
  const markAsRead = useMarkAsRead();
  const toggleReaction = useToggleReaction();
  
  // State for reply
  const [replyingTo, setReplyingTo] = useState<DiscussionMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [hoveredDiscussionId, setHoveredDiscussionId] = useState<string | null>(null);
  
  // Auto-select first discussion when discussions load
  useEffect(() => {
    if (discussions.length > 0 && !selectedDiscussionId) {
      setSelectedDiscussionId(discussions[0].id);
    }
  }, [discussions, selectedDiscussionId]);
  
  // Fetch messages for selected discussion
  const { data: messages = [], isLoading: messagesLoading } = useDiscussionMessages(selectedDiscussionId, 50);

  // Auto-scroll to bottom when messages change (only if user is near bottom)
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current && messagesEndRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Auto-scroll when a new message is sent
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and sort discussions
  const filteredDiscussions = discussions
    .filter(discussion => {
      if (!searchQuery) return true;
      const name = getDiscussionName(discussion).toLowerCase();
      const lastMessage = discussion.lastMessage?.content?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Pinned discussions first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by last message time
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });

  // Get selected discussion details
  const selectedDiscussion = discussions.find(d => d.id === selectedDiscussionId);

  // Format discussion display name
  const getDiscussionName = (discussion: Discussion) => {
    if (discussion.title) return discussion.title;
    if (discussion.discussion_type === 'personal' && discussion.otherParticipant) {
      return discussion.otherParticipant.first_name && discussion.otherParticipant.last_name
        ? `${discussion.otherParticipant.first_name} ${discussion.otherParticipant.last_name}`
        : discussion.otherParticipant.user_name || discussion.otherParticipant.email;
    }
    if (discussion.participants && discussion.participants.length > 0) {
      const otherParticipants = discussion.participants.filter(p => p.user_id !== user?.user_id);
      if (otherParticipants.length === 1) {
        const p = otherParticipants[0];
        return p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.user_name || p.email;
      }
      return `${otherParticipants.length + 1} participants`;
    }
    return 'Untitled Discussion';
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  // Get user display name
  const getUserDisplayName = (author: any) => {
    if (author?.first_name && author?.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author?.user_name || author?.email || 'Unknown User';
  };

  // Get user initials
  const getUserInitials = (author: any) => {
    if (author?.first_name?.[0] && author?.last_name?.[0]) {
      return `${author.first_name[0]}${author.last_name[0]}`.toUpperCase();
    }
    return (author?.user_name?.[0] || author?.email?.[0] || 'U').toUpperCase();
  };

  // Get full avatar URL (handles relative paths)
  const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return it as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }
    // Otherwise, construct the full URL using the API base URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
    return `${apiBaseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedDiscussionId) return;

    try {
      await sendMessage.mutateAsync({
        discussionId: selectedDiscussionId,
        content: messageInput.trim(),
        parent_message_id: replyingTo?.id || null,
      });
      setMessageInput('');
      setReplyingTo(null);
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom();
        messageInputRef.current?.focus();
      }, 100);
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  // Handle creating a new chat (or opening existing one)
  const handleCreateChat = async () => {
    if (!user?.user_id) return;

    try {
      const discussion = await createDiscussion.mutateAsync({
        discussion_type: newChatParticipants.length === 1 ? 'personal' : 'group',
        title: newChatTitle || undefined,
        participant_user_ids: newChatParticipants, // Don't include current user - backend will add it
      });
      
      setIsNewChatDialogOpen(false);
      setNewChatTitle('');
      setNewChatParticipants([]);
      setSelectedDiscussionId(discussion.id);
      
      // Show a subtle message if this was an existing chat (has messages)
      if (discussion.lastMessage) {
        toast({
          title: 'Opened existing conversation',
          description: 'Continuing your previous chat',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating chat',
        description: error.message || 'Failed to create chat',
        variant: 'destructive',
      });
    }
  };

  // Handle pin/unpin
  const handlePin = async (discussionId: string, pinned: boolean) => {
    try {
      await pinDiscussion.mutateAsync({ discussionId, pinned });
      toast({
        title: pinned ? 'Chat pinned' : 'Chat unpinned',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pin status',
        variant: 'destructive',
      });
    }
  };

  // Handle mute/unmute
  const handleMute = async (discussionId: string, muted: boolean) => {
    try {
      await muteDiscussion.mutateAsync({ discussionId, muted });
      toast({
        title: muted ? 'Chat muted' : 'Chat unmuted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update mute status',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);
  const handleDelete = async (discussionId: string) => {
    try {
      await deleteDiscussion.mutateAsync(discussionId);
      setDeleteConfirmOpen(null);
      if (selectedDiscussionId === discussionId) {
        setSelectedDiscussionId(null);
      }
      toast({
        title: 'Chat deleted',
        description: 'The chat has been removed from your list',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (discussionId: string) => {
    const discussion = discussions.find(d => d.id === discussionId);
    if (!discussion?.lastMessage) return;
    
    try {
      await markAsRead.mutateAsync({ discussionId, messageId: discussion.lastMessage.id });
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  };

  // Handle reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedDiscussionId) return;
    try {
      await toggleReaction.mutateAsync({ discussionId: selectedDiscussionId, messageId, emoji });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  // Handle reply
  const handleReply = (message: DiscussionMessage) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  // Handle copy message
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied to clipboard',
    });
  };

  // Quick reaction emojis
  const quickReactions = [
    { emoji: '👍', icon: ThumbsUp },
    { emoji: '👎', icon: ThumbsDown },
    { emoji: '❤️', icon: Heart },
    { emoji: '😂', icon: Laugh },
    { emoji: '❗', icon: AlertCircle },
    { emoji: '❓', icon: HelpCircle },
  ];

  return (
    <div className="flex h-full min-h-0 border-t">
      {discussionsLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : discussionsError ? (
        <div className="flex items-center justify-center w-full h-full p-6">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Failed to load chat discussions. The API endpoint may not be available yet.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          {/* Discussions Sidebar */}
          <div className="w-80 border-r flex flex-col bg-muted/30 min-h-0">
            {/* Search */}
            <div className="px-4 pb-4 pt-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Discussions List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {discussions.length === 0 ? (
                <div className="text-center py-8 px-4 text-sm text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-2">Start a new chat to get started</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredDiscussions.map((discussion) => {
                    const isSelected = discussion.id === selectedDiscussionId;
                    const lastMessage = discussion.lastMessage;
                    const isPinned = discussion.is_pinned || false;
                    const isMuted = discussion.is_muted || false;
                    const isHovered = hoveredDiscussionId === discussion.id;
                    
                    return (
                      <ContextMenu key={discussion.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={`relative group rounded-lg ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted/50'
                            }`}
                            onMouseEnter={() => setHoveredDiscussionId(discussion.id)}
                            onMouseLeave={() => setHoveredDiscussionId(null)}
                          >
                            <div className="flex items-center">
                              <button
                                onClick={() => setSelectedDiscussionId(discussion.id)}
                                className="flex-1 text-left p-3 rounded-lg transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    {discussion.discussion_type === 'personal' && discussion.otherParticipant ? (
                                      <>
                                        <AvatarImage src={getAvatarUrl(discussion.otherParticipant.avatar_url) || undefined} />
                                        <AvatarFallback>
                                          {getUserInitials(discussion.otherParticipant)}
                                        </AvatarFallback>
                                      </>
                                    ) : (
                                      <>
                                        <AvatarImage src={getAvatarUrl(discussion.participants?.find(p => p.user_id !== user?.user_id)?.avatar_url || discussion.participants?.[0]?.avatar_url) || undefined} />
                                        <AvatarFallback>
                                          <Users className="h-5 w-5" />
                                        </AvatarFallback>
                                      </>
                                    )}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1 flex-1 min-w-0">
                                        {isPinned && (
                                          <Pin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                        )}
                                        {isMuted && (
                                          <BellOff className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                        )}
                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-primary-foreground' : ''}`}>
                                          {getDiscussionName(discussion)}
                                        </span>
                                      </div>
                                      {discussion.last_message_at && (
                                        <span className={`text-xs flex-shrink-0 ml-2 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                          {formatMessageTime(discussion.last_message_at)}
                                        </span>
                                      )}
                                    </div>
                                    {lastMessage && (
                                      <div className="space-y-0.5">
                                        {/* Sender name */}
                                        {lastMessage.author && (
                                          <p className={`text-xs font-medium truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                            {lastMessage.author.first_name && lastMessage.author.last_name
                                              ? `${lastMessage.author.first_name} ${lastMessage.author.last_name}`
                                              : lastMessage.author.user_name || lastMessage.author.email}
                                          </p>
                                        )}
                                        {/* Subject (discussion title) if exists */}
                                        {discussion.title && (
                                          <p className={`text-xs font-medium truncate ${isSelected ? 'text-primary-foreground/90' : 'text-foreground/80'}`}>
                                            {discussion.title}
                                          </p>
                                        )}
                                        {/* Message preview */}
                                        <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                          {lastMessage.content}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                              
                              {/* Three-dot menu trigger */}
                              <div 
                                className="relative flex items-center pr-2"
                                onMouseEnter={() => setHoveredDiscussionId(discussion.id)}
                                onMouseLeave={() => setHoveredDiscussionId(null)}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Keep menu open on click
                                  }}
                                  className={`p-1.5 rounded transition-colors ${
                                    isHovered 
                                      ? 'bg-muted' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                  aria-label="Chat options"
                                >
                                  <MoreVertical className={`h-4 w-4 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                                </button>
                                
                                {/* Hover Actions Menu - Horizontal (Condensed) */}
                                {isHovered && (
                                  <div className="absolute right-0 top-full mt-1 flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg z-20 p-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePin(discussion.id, !isPinned);
                                        setHoveredDiscussionId(null);
                                      }}
                                      className="p-1.5 rounded hover:bg-muted transition-colors"
                                      title={isPinned ? 'Unpin' : 'Pin'}
                                      aria-label={isPinned ? 'Unpin chat' : 'Pin chat'}
                                    >
                                      {isPinned ? (
                                        <PinOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Pin className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMute(discussion.id, !isMuted);
                                        setHoveredDiscussionId(null);
                                      }}
                                      className="p-1.5 rounded hover:bg-muted transition-colors"
                                      title={isMuted ? 'Unmute' : 'Mute'}
                                      aria-label={isMuted ? 'Unmute chat' : 'Mute chat'}
                                    >
                                      {isMuted ? (
                                        <Bell className="h-3.5 w-3.5" />
                                      ) : (
                                        <BellOff className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    {lastMessage && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(discussion.id);
                                          setHoveredDiscussionId(null);
                                        }}
                                        className="p-1.5 rounded hover:bg-muted transition-colors"
                                        title="Mark as read"
                                        aria-label="Mark as read"
                                      >
                                        <CheckCheck className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <div className="w-px h-4 bg-border mx-0.5" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmOpen(discussion.id);
                                        setHoveredDiscussionId(null);
                                      }}
                                      className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                                      title="Delete"
                                      aria-label="Delete chat"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handlePin(discussion.id, !isPinned)}>
                            {isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin
                              </>
                            )}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleMute(discussion.id, !isMuted)}>
                            {isMuted ? (
                              <>
                                <Bell className="h-4 w-4 mr-2" />
                                Unmute
                              </>
                            ) : (
                              <>
                                <BellOff className="h-4 w-4 mr-2" />
                                Mute
                              </>
                            )}
                          </ContextMenuItem>
                          {lastMessage && (
                            <ContextMenuItem onClick={() => handleMarkAsRead(discussion.id)}>
                              <CheckCheck className="h-4 w-4 mr-2" />
                              Mark as read
                            </ContextMenuItem>
                          )}
                          <ContextMenuSeparator />
                          <ContextMenuItem 
                            onClick={() => setDeleteConfirmOpen(discussion.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Chat Button at Bottom (like reference) */}
            <div className="flex-shrink-0 p-4 border-t">
              <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chat</DialogTitle>
                    <DialogDescription>
                      Start a new conversation with one or more team members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="chat-title">Chat Title (Optional)</Label>
                      <Input
                        id="chat-title"
                        placeholder="Enter chat title..."
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Participants</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Select participants (you will be added automatically)
                      </p>
                      <Input
                        placeholder="User IDs (comma-separated) - TODO: Replace with user picker"
                        value={newChatParticipants.join(', ')}
                        onChange={(e) => {
                          const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                          setNewChatParticipants(ids);
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewChatDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateChat}
                      disabled={createDiscussion.isPending || newChatParticipants.length === 0}
                    >
                      {createDiscussion.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Chat'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedDiscussionId ? (
              <>
                {/* Discussion Header */}
                <div className="flex-shrink-0 p-4 border-b bg-background">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {selectedDiscussion?.discussion_type === 'personal' && selectedDiscussion?.otherParticipant ? (
                        <>
                          <AvatarImage src={getAvatarUrl(selectedDiscussion.otherParticipant.avatar_url) || undefined} />
                          <AvatarFallback>
                            {getUserInitials(selectedDiscussion.otherParticipant)}
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={getAvatarUrl(selectedDiscussion?.participants?.[0]?.avatar_url) || undefined} />
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {selectedDiscussion ? getDiscussionName(selectedDiscussion) : 'Loading...'}
                      </h3>
                      {selectedDiscussion?.participants && selectedDiscussion.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedDiscussion.participants.length} participant{selectedDiscussion.participants.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages - Scrollable */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) :                     messages.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-xs mt-2">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {[...messages].reverse().map((message: DiscussionMessage) => {
                        const author = message.author || {
                          user_id: message.created_by,
                          user_name: 'Unknown User',
                          email: '',
                          avatar_url: null,
                        };
                        const isCurrentUser = author.user_id === user?.user_id;
                        const isHovered = hoveredMessageId === message.id;
                        const reactions = message.reactions || [];
                        const reactionGroups = reactions.reduce((acc, r) => {
                          if (!acc[r.emoji]) acc[r.emoji] = [];
                          acc[r.emoji].push(r);
                          return acc;
                        }, {} as Record<string, typeof reactions>);

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 group ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                            onMouseEnter={() => setHoveredMessageId(message.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={getAvatarUrl(author.avatar_url) || undefined} alt={getUserDisplayName(author)} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 min-w-0 flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                              <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                <span className="text-sm font-medium">
                                  {isCurrentUser ? 'You' : getUserDisplayName(author)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.created_at)}
                                </span>
                              </div>
                              
                              {/* Reply quote */}
                              {message.parentMessage && (
                                <div className={`mb-2 text-xs border-l-2 pl-2 py-1 rounded ${
                                  isCurrentUser ? 'border-primary/30 text-primary-foreground/70' : 'border-muted-foreground/30 text-muted-foreground'
                                }`}>
                                  <div className="font-medium">
                                    {message.parentMessage.author ? getUserDisplayName(message.parentMessage.author) : 'Unknown'}
                                  </div>
                                  <div className="truncate">{message.parentMessage.content}</div>
                                </div>
                              )}
                              
                              <div className="relative w-full">
                                <div className={`text-sm text-foreground break-words rounded-lg p-3 w-fit max-w-[75%] ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground ml-auto'
                                    : 'bg-muted'
                                }`}>
                                  {message.content}
                                </div>
                                
                                {/* Hover menu */}
                                {(isHovered || hoveredMessageId === message.id) && (
                                  <div className={`absolute ${isCurrentUser ? 'left-0' : 'right-0'} top-0 flex items-center gap-1 bg-white dark:bg-gray-800 border rounded-lg p-1 shadow-lg z-10`}>
                                    {/* Quick reactions */}
                                    {quickReactions.map(({ emoji, icon: Icon }) => {
                                      const hasReacted = reactions.some(r => r.emoji === emoji && r.user_id === user?.user_id);
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => handleReaction(message.id, emoji)}
                                          className={`p-1.5 rounded hover:bg-muted transition-colors ${
                                            hasReacted ? 'bg-primary/20' : ''
                                          }`}
                                          title={emoji}
                                        >
                                          <Icon className="h-4 w-4" />
                                        </button>
                                      );
                                    })}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button 
                                          className="p-1.5 rounded hover:bg-muted transition-colors"
                                          aria-label="Open emoji picker"
                                          title="Add emoji"
                                        >
                                          <Smile className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <div className="p-2 grid grid-cols-6 gap-1">
                                          {['😀', '😂', '🥰', '😍', '🤔', '😮', '👍', '👎', '❤️', '🔥', '🎉', '💯'].map(emoji => (
                                            <button
                                              key={emoji}
                                              onClick={() => handleReaction(message.id, emoji)}
                                              className="text-lg hover:scale-125 transition-transform p-1"
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    <div className="w-px h-4 bg-border mx-1" />
                                    
                                    <button
                                      onClick={() => handleReply(message)}
                                      className="p-1.5 rounded hover:bg-muted transition-colors"
                                      title="Reply"
                                    >
                                      <Reply className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCopyMessage(message.content)}
                                      className="p-1.5 rounded hover:bg-muted transition-colors"
                                      title="Copy"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                    {isCurrentUser && (
                                      <button
                                        className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                                        title="Delete message"
                                        aria-label="Delete message"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Reactions */}
                              {/* Reactions display */}
                              {Object.keys(reactionGroups).length > 0 && (
                                <div className={`mt-1 flex flex-wrap gap-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                  {Object.entries(reactionGroups).map(([emoji, emojiReactions]) => {
                                    const hasReacted = emojiReactions.some(r => r.user_id === user?.user_id);
                                    return (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReaction(message.id, emoji)}
                                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                          hasReacted
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white dark:bg-gray-800 border-border hover:bg-muted/80'
                                        }`}
                                        title={`${emojiReactions.length} reaction${emojiReactions.length !== 1 ? 's' : ''}`}
                                      >
                                        <span className="mr-1">{emoji}</span>
                                        <span>{emojiReactions.length}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex-shrink-0 p-4 border-t bg-background">
                  {/* Reply preview */}
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-muted rounded-lg border-l-2 border-primary flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-primary mb-1">Replying to {getUserDisplayName(replyingTo.author)}</div>
                        <div className="text-xs text-muted-foreground truncate">{replyingTo.content}</div>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        aria-label="Cancel reply"
                        title="Cancel reply"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      ref={messageInputRef}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                      className="min-h-[60px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                        if (e.key === 'Escape' && replyingTo) {
                          setReplyingTo(null);
                        }
                      }}
                      disabled={sendMessage.isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="flex-shrink-0"
                      disabled={!messageInput.trim() || sendMessage.isPending}
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen !== null} onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This will only remove it from your view. Other participants will still be able to see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmOpen && handleDelete(deleteConfirmOpen)}
              disabled={deleteDiscussion.isPending}
            >
              {deleteDiscussion.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

