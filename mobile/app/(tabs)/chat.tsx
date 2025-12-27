import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NeumorphicView from '../../components/NeumorphicView';
// Date formatting utilities
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (messageDate.getTime() === today.getTime()) {
    // Today - show time
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Types
interface DiscussionParticipant {
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface MessageReaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

interface DiscussionMessage {
  id: string;
  discussion_id: string;
  content: string;
  created_by: string;
  created_at: string;
  author?: DiscussionParticipant;
  reactions?: MessageReaction[];
  parent_message_id?: string | null;
  parentMessage?: DiscussionMessage | null;
}

interface Discussion {
  id: string;
  title?: string | null;
  discussion_type: 'personal' | 'group';
  last_message_at?: string | null;
  participants?: DiscussionParticipant[];
  lastMessage?: DiscussionMessage | null;
  otherParticipant?: DiscussionParticipant | null;
  is_pinned?: boolean;
  is_muted?: boolean;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscussionMessage | null>(null);
  const [longPressedMessage, setLongPressedMessage] = useState<DiscussionMessage | null>(null);
  const messagesEndRef = useRef<FlatList>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Track if we're viewing a chat thread (for mobile navigation)
  const [viewingChatThread, setViewingChatThread] = useState(false);
  
  // New state for iOS Messages-like features
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'group' | 'unread'>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDiscussions, setSelectedDiscussions] = useState<Set<string>>(new Set());

  // Listen for screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Determine if we're on a mobile device (width < 768px)
  const isMobile = screenData.width < 768;


  const [refreshingDiscussions, setRefreshingDiscussions] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);

  // Fetch discussions
  const { data: discussionsRaw = [], isLoading: discussionsLoading, refetch: refetchDiscussions } = useQuery({
    queryKey: ['discussions'],
    queryFn: async () => {
      const response = await apiClient.request<Discussion[]>('/api/discussions');
      return response;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Helper function to get discussion name (moved before useMemo)
  const getDiscussionName = (discussion: Discussion): string => {
    if (discussion.title) return discussion.title;
    if (discussion.discussion_type === 'personal' && discussion.otherParticipant) {
      const other = discussion.otherParticipant;
      if (other.first_name && other.last_name) {
        return `${other.first_name} ${other.last_name}`;
      }
      return other.user_name || other.email || 'Unknown';
    }
    if (discussion.participants && discussion.participants.length > 0) {
      const names = discussion.participants
        .filter(p => p.user_id !== user?.id)
        .map(p => {
          if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
          return p.user_name || p.email || 'Unknown';
        });
      return names.length > 0 ? names.join(', ') : 'Group Chat';
    }
    return 'Group Chat';
  };

  // Filter and sort discussions
  const filteredAndSortedDiscussions = React.useMemo(() => {
    let filtered = [...discussionsRaw];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(discussion => {
        // Search in discussion name
        const name = getDiscussionName(discussion).toLowerCase();
        if (name.includes(query)) return true;
        
        // Search in last message content
        if (discussion.lastMessage?.content?.toLowerCase().includes(query)) return true;
        
        // Search in participant names
        if (discussion.participants) {
          const participantNames = discussion.participants
            .map(p => `${p.first_name || ''} ${p.last_name || ''} ${p.user_name || ''} ${p.email || ''}`.toLowerCase());
          if (participantNames.some(n => n.includes(query))) return true;
        }
        
        return false;
      });
    }
    
    // Apply type filter
    if (filterType === 'personal') {
      filtered = filtered.filter(d => d.discussion_type === 'personal');
    } else if (filterType === 'group') {
      filtered = filtered.filter(d => d.discussion_type === 'group');
    } else if (filterType === 'unread') {
      // TODO: Implement unread filter when unread status is available
      // For now, we'll show all
    }
    
    // Sort: pinned first, then by last message time (newest first)
    return filtered.sort((a, b) => {
      // Pinned discussions first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by last message time (newest first)
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : (a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0);
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : (b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0);
      return bTime - aTime; // Descending order (newest first)
    });
  }, [discussionsRaw, searchQuery, filterType, user?.id]);
  
  // Use filtered discussions
  const discussions = filteredAndSortedDiscussions;

  // Fetch messages for selected discussion
  const { data: messagesRaw = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['discussions', selectedDiscussionId, 'messages'],
    queryFn: async () => {
      if (!selectedDiscussionId) return [];
      const response = await apiClient.request<DiscussionMessage[]>(
        `/api/discussions/${selectedDiscussionId}/messages?limit=50`
      );
      return response;
    },
    enabled: !!selectedDiscussionId,
    refetchInterval: 5000,
    staleTime: 2000,
  });

  // Reverse messages array so newest appears at bottom (backend returns newest first)
  const messages = React.useMemo(() => {
    return [...messagesRaw].reverse();
  }, [messagesRaw]);

  // Auto-select first discussion (only on desktop/tablet, not mobile or web view)
  useEffect(() => {
    if (!isMobile && Platform.OS !== 'web' && discussions.length > 0 && !selectedDiscussionId) {
      setSelectedDiscussionId(discussions[0].id);
    }
  }, [discussions, selectedDiscussionId, isMobile]);

  // Handle discussion selection
  const handleSelectDiscussion = (discussionId: string) => {
    setSelectedDiscussionId(discussionId);
    // Set viewingChatThread for mobile devices or web view (when screen is mobile-sized)
    if (isMobile || Platform.OS === 'web') {
      setViewingChatThread(true);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setViewingChatThread(false);
    setSelectedDiscussionId(null);
    setReplyingTo(null);
  };

  // Auto-scroll to bottom when new messages arrive (newest at bottom, like web)
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string, parentMessageId?: string | null) => {
      if (!selectedDiscussionId) throw new Error('No discussion selected');
      
      // Ensure parent_message_id is a valid string or null (not an object)
      let normalizedParentMessageId: string | null = null;
      if (parentMessageId) {
        if (typeof parentMessageId === 'string' && parentMessageId.trim() !== '') {
          normalizedParentMessageId = parentMessageId.trim();
        } else {
          console.warn('⚠️ [CHAT] Invalid parent_message_id type:', typeof parentMessageId, parentMessageId);
          normalizedParentMessageId = null;
        }
      }
      
      const requestBody = { 
        content,
        parent_message_id: normalizedParentMessageId,
      };
      
      console.log('🔍 [CHAT] Sending message request:', JSON.stringify(requestBody, null, 2));
      
      const response = await apiClient.request<DiscussionMessage>(
        `/api/discussions/${selectedDiscussionId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );
      return response;
    },
    onSuccess: () => {
      setMessageInput('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['discussions', selectedDiscussionId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!selectedDiscussionId) throw new Error('No discussion selected');
      const response = await apiClient.request<DiscussionMessage>(
        `/api/discussions/${selectedDiscussionId}/messages/${messageId}/reactions`,
        {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', selectedDiscussionId, 'messages'] });
      setLongPressedMessage(null);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!selectedDiscussionId) throw new Error('No discussion selected');
      await apiClient.request(
        `/api/discussions/${selectedDiscussionId}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', selectedDiscussionId, 'messages'] });
      setLongPressedMessage(null);
    },
  });


  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedDiscussionId) return;
    // Ensure parent_message_id is a valid string or null
    let parentMessageId: string | null = null;
    if (replyingTo) {
      // Extract ID - handle both string and object cases
      const messageId = replyingTo.id;
      console.log('🔍 [CHAT] replyingTo.id type:', typeof messageId, messageId);
      
      if (typeof messageId === 'string' && messageId.trim() !== '') {
        parentMessageId = messageId.trim();
      } else if (messageId && typeof messageId === 'object') {
        // If ID is an object, try to extract a string value
        console.warn('⚠️ [CHAT] replyingTo.id is an object, attempting to extract string:', JSON.stringify(messageId));
        // Try common object properties that might contain the ID
        const extractedId = (messageId as any).id || (messageId as any).value || (messageId as any).toString();
        if (typeof extractedId === 'string' && extractedId.trim() !== '') {
          parentMessageId = extractedId.trim();
        } else {
          console.error('❌ [CHAT] Could not extract valid string ID from object:', messageId);
          parentMessageId = null;
        }
      } else if (messageId) {
        // Try to convert to string
        parentMessageId = String(messageId).trim() || null;
      }
    }
    
    console.log('🔍 [CHAT] Final parent_message_id:', parentMessageId, typeof parentMessageId);
    sendMessageMutation.mutate(messageInput.trim(), parentMessageId);
  };

  const handleLongPress = (message: DiscussionMessage) => {
    setLongPressedMessage(message);
  };

  const handleReply = (message: DiscussionMessage) => {
    // Ensure we're storing a clean message object with a string ID
    const cleanMessage: DiscussionMessage = {
      ...message,
      id: typeof message.id === 'string' ? message.id : String(message.id || ''),
    };
    console.log('🔍 [CHAT] Setting replyingTo message:', cleanMessage.id, typeof cleanMessage.id);
    setReplyingTo(cleanMessage);
    setLongPressedMessage(null);
  };

  const handleReact = (message: DiscussionMessage, emoji: string) => {
    toggleReactionMutation.mutate({ messageId: message.id, emoji });
  };

  const handleCopy = (content: string) => {
    // Copy to clipboard
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(content);
    } else {
      // For React Native, you might need Clipboard from @react-native-clipboard/clipboard
      // For now, we'll just close the modal
    }
    setLongPressedMessage(null);
  };

  const handleForward = (message: DiscussionMessage) => {
    // Forward functionality - could open a dialog to select recipient
    Alert.alert('Forward', 'Forward functionality coming soon');
    setLongPressedMessage(null);
  };

  const handleDelete = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMessageMutation.mutate(messageId, {
              onError: (error: any) => {
                Alert.alert(
                  'Error',
                  error?.message || 'Failed to delete message. You can only delete your own messages.',
                  [{ text: 'OK' }]
                );
              },
            });
          },
        },
      ]
    );
  };

  // Delete discussion handler
  const handleDeleteDiscussion = async (discussionId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.request(`/api/discussions/${discussionId}`, {
                method: 'DELETE',
              });
              queryClient.invalidateQueries({ queryKey: ['discussions'] });
              if (selectedDiscussionId === discussionId) {
                setSelectedDiscussionId(null);
                setViewingChatThread(false);
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  // Toggle discussion selection in edit mode
  const toggleDiscussionSelection = (discussionId: string) => {
    const newSelected = new Set(selectedDiscussions);
    if (newSelected.has(discussionId)) {
      newSelected.delete(discussionId);
    } else {
      newSelected.add(discussionId);
    }
    setSelectedDiscussions(newSelected);
  };

  // Pin/unpin discussion
  const handlePinDiscussion = async (discussionId: string, pinned: boolean) => {
    try {
      await apiClient.request(`/api/discussions/${discussionId}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned }),
      });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pin conversation');
    }
  };

  // Handle edit mode actions
  const handleEditModeAction = async (action: 'pin' | 'delete') => {
    if (selectedDiscussions.size === 0) {
      Alert.alert('No Selection', 'Please select at least one conversation');
      return;
    }

    const selectedArray = Array.from(selectedDiscussions);
    
    if (action === 'delete') {
      Alert.alert(
        'Delete Conversations',
        `Are you sure you want to delete ${selectedArray.length} conversation${selectedArray.length > 1 ? 's' : ''}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await Promise.all(
                  selectedArray.map(id => 
                    apiClient.request(`/api/discussions/${id}`, { method: 'DELETE' })
                  )
                );
                queryClient.invalidateQueries({ queryKey: ['discussions'] });
                setSelectedDiscussions(new Set());
                setIsEditMode(false);
                if (selectedArray.includes(selectedDiscussionId || '')) {
                  setSelectedDiscussionId(null);
                  setViewingChatThread(false);
                }
              } catch (error: any) {
                Alert.alert('Error', 'Failed to delete some conversations');
              }
            },
          },
        ]
      );
    } else if (action === 'pin') {
      try {
        // Toggle pin state for selected discussions
        await Promise.all(
          selectedArray.map(async (id) => {
            const discussion = discussions.find(d => d.id === id);
            const newPinnedState = !discussion?.is_pinned;
            await apiClient.request(`/api/discussions/${id}/pin`, {
              method: 'PATCH',
              body: JSON.stringify({ pinned: newPinnedState }),
            });
          })
        );
        queryClient.invalidateQueries({ queryKey: ['discussions'] });
        setSelectedDiscussions(new Set());
        setIsEditMode(false);
      } catch (error: any) {
        Alert.alert('Error', 'Failed to pin some conversations');
      }
    }
  };


  const getUserInitials = (author: DiscussionParticipant): string => {
    if (author.first_name?.[0] && author.last_name?.[0]) {
      return `${author.first_name[0]}${author.last_name[0]}`.toUpperCase();
    }
    return (author.user_name?.[0] || author.email?.[0] || 'U').toUpperCase();
  };

  // Construct full avatar URL from relative path
  const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return it as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }
    // Otherwise, construct the full URL using the API base URL
    const apiBaseUrl = apiClient.getBaseURL();
    return `${apiBaseUrl}${avatarUrl}`;
  };

  const selectedDiscussion = discussions.find(d => d.id === selectedDiscussionId);
  
  // Detect dark theme for neumorphic styling
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && theme.colors.background === '#292929');

  // Simple Message Component (no swipe functionality)
  const MessageComponent = ({ message, isCurrentUser, author }: {
    message: DiscussionMessage;
    isCurrentUser: boolean;
    author: DiscussionParticipant;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={() => handleLongPress(message)}
        delayLongPress={500}
      >
            <View style={isCurrentUser ? styles.messageRowReverse : styles.messageRow}>
              {/* Avatar for incoming messages */}
              {!isCurrentUser && (
                <View style={styles.messageAvatarContainer}>
                  {getAvatarUrl(author.avatar_url) ? (
                    <Image 
                      source={{ uri: getAvatarUrl(author.avatar_url)! }} 
                      style={styles.messageAvatar}
                    />
                  ) : (
                    <View style={[styles.messageAvatar, styles.messageAvatarPlaceholder]}>
                      <Text style={styles.messageAvatarText}>
                        {getUserInitials(author)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isCurrentUser
                    ? styles.messageBubbleOutgoing
                    : styles.messageBubbleIncoming,
                ]}
              >
                {!isCurrentUser && (
                  <View style={styles.messageAuthorContainer}>
                    <Text style={styles.messageAuthor}>
                      {author.first_name && author.last_name
                        ? `${author.first_name} ${author.last_name}`
                        : author.user_name || 'Unknown'}
                    </Text>
                  </View>
                )}
                {message.parentMessage && (
                  <View style={styles.replyPreview}>
                    <Text style={styles.replyPreviewText} numberOfLines={1}>
                      {message.parentMessage.content}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.messageText,
                    isCurrentUser && styles.messageTextOutgoing,
                  ]}
                >
                  {message.content}
                </Text>
                {message.reactions && message.reactions.length > 0 && (
                  <View style={styles.reactionsContainer}>
                    {Object.entries(
                      message.reactions.reduce((acc, r) => {
                        if (!acc[r.emoji]) acc[r.emoji] = [];
                        acc[r.emoji].push(r);
                        return acc;
                      }, {} as Record<string, MessageReaction[]>)
                    ).map(([emoji, reactions]) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.reactionBadge}
                        onPress={() => handleReact(message, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text style={styles.reactionCount}>{reactions.length}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.messageMeta}>
                  <Text
                    style={[
                      styles.messageTime,
                      isCurrentUser && { color: theme.colors.primaryForeground + '80' },
                    ]}
                  >
                    {formatMessageTime(message.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
    );
  };

  // Swipeable Discussion Item Component
  const SwipeableDiscussionItem = ({ discussion, isSelected, isEditMode, isEditSelected, onSelect, onDelete }: {
    discussion: Discussion;
    isSelected: boolean;
    isEditMode: boolean;
    isEditSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
  }) => {
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const [swipedDiscussionId, setSwipedDiscussionId] = useState<string | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const hasSwipedRef = useRef(false);
    const swipeStartTimeRef = useRef<number>(0);
    
    // Reset swipe state when discussion changes or when swiped state changes
    useEffect(() => {
      if (swipedDiscussionId !== discussion.id && swipeAnim._value < 0) {
        // Reset animation if this discussion is no longer swiped
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }, [swipedDiscussionId, discussion.id]);
    
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to horizontal swipes
          const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
          if (isHorizontalSwipe) {
            setIsSwiping(true);
            hasSwipedRef.current = false;
          }
          return isHorizontalSwipe;
        },
        onPanResponderGrant: () => {
          swipeStartTimeRef.current = Date.now();
          hasSwipedRef.current = false;
          // Close any other swiped discussions
          if (swipedDiscussionId && swipedDiscussionId !== discussion.id) {
            setSwipedDiscussionId(null);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            // Swiping left - reveal delete
            const clampedDx = Math.max(gestureState.dx, -120);
            swipeAnim.setValue(clampedDx);
            hasSwipedRef.current = true;
          } else if (gestureState.dx > 0 && swipeAnim._value < 0) {
            // Swiping right - close swipe
            const newValue = Math.min(gestureState.dx, 0);
            swipeAnim.setValue(newValue);
            hasSwipedRef.current = true;
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          setIsSwiping(false);
          const currentValue = swipeAnim._value;
          const swipeDuration = Date.now() - swipeStartTimeRef.current;
          
          // If user swiped left enough (threshold lowered to -50px), reveal delete button
          if (gestureState.dx < -50 || currentValue < -50) {
            Animated.spring(swipeAnim, {
              toValue: -120,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
            setSwipedDiscussionId(discussion.id);
            hasSwipedRef.current = true;
            // Reset after a short delay to allow tap detection
            setTimeout(() => {
              hasSwipedRef.current = false;
            }, 300);
          } 
          // If user swiped right or didn't swipe enough, close
          else if (gestureState.dx > 20 || (currentValue > -50 && currentValue >= 0)) {
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
            setSwipedDiscussionId(null);
            hasSwipedRef.current = false;
          }
          // If it was a quick tap (not a swipe), don't mark as swiped
          else if (swipeDuration < 100 && Math.abs(gestureState.dx) < 10) {
            hasSwipedRef.current = false;
          }
        },
        onPanResponderTerminate: () => {
          setIsSwiping(false);
          // Only close if it wasn't a significant swipe
          if (swipeAnim._value > -60) {
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            setSwipedDiscussionId(null);
          }
        },
      })
    ).current;

    return (
      <View style={styles.swipeableDiscussionContainer}>
        {/* Swipe actions - behind the discussion item */}
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeAction, styles.swipeActionDelete]}
            activeOpacity={0.8}
            onPress={() => {
              // Close swipe first, then delete
              Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start(() => {
                setSwipedDiscussionId(null);
                onDelete();
              });
            }}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Discussion item - can be swiped left to reveal actions */}
        <Animated.View
          style={[
            styles.swipeableDiscussionContent,
            {
              transform: [{ translateX: swipeAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[
              styles.discussionItem,
              isSelected && styles.discussionItemSelected,
              isEditSelected && styles.discussionItemEditSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              // If swiped open, close it on tap
              if (swipedDiscussionId === discussion.id) {
                Animated.spring(swipeAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 100,
                  friction: 8,
                }).start();
                setSwipedDiscussionId(null);
              } 
              // Only select if we didn't just swipe
              else if (!hasSwipedRef.current && !isSwiping) {
                onSelect();
              }
            }}
            delayPressIn={swipedDiscussionId === discussion.id ? 0 : 50}
          >
            {/* Edit mode checkbox */}
            {isEditMode && (
              <View style={styles.editCheckbox}>
                <Ionicons 
                  name={isEditSelected ? "checkbox" : "checkbox-outline"} 
                  size={24} 
                  color={isEditSelected ? theme.colors.primary : theme.colors.mutedForeground} 
                />
              </View>
            )}
            <Text style={styles.discussionName}>
              {getDiscussionName(discussion)}
            </Text>
            {discussion.lastMessage && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                {/* Conversation partner avatar */}
                {(discussion.discussion_type === 'personal' && discussion.otherParticipant) ? (
                  <View style={styles.listAvatarContainer}>
                    {getAvatarUrl(discussion.otherParticipant.avatar_url) ? (
                      <Image 
                        source={{ uri: getAvatarUrl(discussion.otherParticipant.avatar_url)! }} 
                        style={styles.listAvatar}
                      />
                    ) : (
                      <View style={[styles.listAvatar, styles.listAvatarPlaceholder]}>
                        <Text style={styles.listAvatarText}>
                          {getUserInitials(discussion.otherParticipant)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : discussion.participants && discussion.participants.length > 0 ? (
                  (() => {
                    const otherParticipant = discussion.participants.find(p => p.user_id !== user?.id) || discussion.participants[0];
                    return (
                      <View style={styles.listAvatarContainer}>
                        {getAvatarUrl(otherParticipant.avatar_url) ? (
                          <Image 
                            source={{ uri: getAvatarUrl(otherParticipant.avatar_url)! }} 
                            style={styles.listAvatar}
                          />
                        ) : (
                          <View style={[styles.listAvatar, styles.listAvatarPlaceholder]}>
                            <Text style={styles.listAvatarText}>
                              {getUserInitials(otherParticipant)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()
                ) : null}
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {/* Sender name with glow */}
                  {discussion.lastMessage.author && (
                    <View style={styles.senderNameContainer}>
                      <Text style={styles.senderNameGlow} numberOfLines={1}>
                        {discussion.lastMessage.author.first_name && discussion.lastMessage.author.last_name
                          ? `${discussion.lastMessage.author.first_name} ${discussion.lastMessage.author.last_name}`
                          : discussion.lastMessage.author.user_name || discussion.lastMessage.author.email}
                      </Text>
                    </View>
                  )}
                  {/* Subject (discussion title) if exists */}
                  {discussion.title && (
                    <Text style={[styles.discussionPreview, { fontWeight: '500', marginBottom: 2 }]} numberOfLines={1}>
                      {discussion.title}
                    </Text>
                  )}
                  {/* Message preview */}
                  <Text style={styles.discussionPreview} numberOfLines={1}>
                    {discussion.lastMessage.content}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: Platform.OS === 'web' ? '100%' : undefined,
      height: Platform.OS === 'web' ? '100vh' : undefined,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    twoColumnLayout: {
      flex: 1,
      width: Platform.OS === 'web' ? '100%' : undefined,
      height: Platform.OS === 'web' ? '100%' : undefined,
      flexDirection: isMobile ? 'column' : 'row',
    },
    sidebar: {
      width: (isMobile || Platform.OS === 'web') ? '100%' : 300,
      flex: (isMobile || Platform.OS === 'web') ? 1 : 0,
      height: Platform.OS === 'web' ? '100%' : undefined,
      backgroundColor: theme.colors.card,
      display: (isMobile || Platform.OS === 'web') && viewingChatThread ? 'none' : 'flex',
    },
    sidebarHeader: {
      padding: 16,
      paddingTop: 16,
      paddingBottom: 20, // Extra padding at bottom for search bar shadows
      zIndex: 10,
      // Don't set overflow - let NeumorphicView handle it
      // Distinct header with stronger shadow
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sidebarTitle: {
      ...theme.typography.h2,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    headerButton: {
      padding: 4,
    },
    headerButtonText: {
      ...theme.typography.body,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      zIndex: 5,
      minHeight: 44, // Ensure minimum height for touch targets
      width: '100%', // Ensure full width
      // Sunken/indent look with debossed neumorphic style
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.foreground,
      paddingVertical: 4,
    },
    searchClearButton: {
      padding: 4,
      marginLeft: 8,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      zIndex: 1,
      marginTop: 4,
      flexWrap: 'wrap', // Allow wrapping on small screens
      overflow: 'visible', // Allow content to be visible
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    filterButtonText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    editCheckbox: {
      marginRight: 12,
    },
    discussionsList: {
      flex: 1,
    },
    discussionItem: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      // Remove border, use shadows instead
    },
    discussionItemSelected: {
      backgroundColor: theme.colors.primary + '10',
    },
    discussionItemEditSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    discussionName: {
      ...theme.typography.body,
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.foreground,
    },
    discussionPreview: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    listAvatarContainer: {
      marginRight: 8,
    },
    listAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    listAvatarPlaceholder: {
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listAvatarText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    senderNameContainer: {
      marginBottom: 2,
    },
    senderNameGlow: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.foreground,
      textShadowColor: theme.colors.primary + '40',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    messagesContainer: {
      flex: 1,
      width: Platform.OS === 'web' ? '100%' : undefined,
      height: Platform.OS === 'web' ? '100%' : undefined,
      backgroundColor: theme.colors.background,
      display: (isMobile || Platform.OS === 'web') && !viewingChatThread ? 'none' : 'flex',
    },
    messagesHeader: {
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 16 : 16,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      // Remove border, use shadows instead
    },
    backButton: {
      marginRight: 12,
      padding: 8,
    },
    messagesHeaderTitle: {
      ...theme.typography.heading,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
      flex: 1,
    },
    messagesList: {
      flex: 1,
      padding: 16,
    },
    messageItem: {
      marginBottom: 16,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    messageRowReverse: {
      flexDirection: 'row-reverse',
    },
    messageAvatarContainer: {
      marginRight: 8,
      marginBottom: 4,
    },
    messageAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    messageAvatarPlaceholder: {
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageAvatarText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    messageAuthorContainer: {
      marginBottom: 4,
    },
    messageBubble: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 16,
    },
    messageBubbleIncoming: {
      backgroundColor: theme.colors.muted,
      marginRight: 8,
    },
    messageBubbleOutgoing: {
      backgroundColor: theme.colors.primary,
      marginLeft: 8,
    },
    messageText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
    },
    messageTextOutgoing: {
      color: theme.colors.primaryForeground || '#fff',
    },
    messageMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    messageAuthor: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    messageTime: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      // Remove border, use shadows instead
    },
    input: {
      flex: 1,
      ...theme.typography.body,
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyStateText: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    replyPreview: {
      padding: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.muted + '80',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    replyPreviewText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    reactionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8,
    },
    reactionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reactionEmoji: {
      fontSize: 14,
      marginRight: 4,
    },
    reactionCount: {
      ...theme.typography.caption,
      fontSize: 12,
      color: theme.colors.foreground,
    },
    swipeableDiscussionContainer: {
      position: 'relative',
      overflow: 'hidden',
    },
    swipeableDiscussionContent: {
      backgroundColor: theme.colors.card,
      zIndex: 1,
      width: '100%',
    },
    swipeActions: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 0,
    },
    swipeAction: {
      width: 60,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    swipeActionDelete: {
      backgroundColor: theme.colors.destructive,
    },
    actionSheet: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    actionSheetTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 20,
      textAlign: 'center',
    },
    actionSheetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      marginBottom: 8,
    },
    actionSheetItemText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      marginLeft: 12,
    },
    reactionPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    reactionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    replyInputPreview: {
      padding: 12,
      marginBottom: 8,
      backgroundColor: theme.colors.muted,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    replyInputPreviewText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    newChatButtonContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    newChatButtonText: {
      ...theme.typography.body,
      color: theme.colors.primaryForeground || '#fff',
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  if (discussionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.twoColumnLayout}>
        {/* Sidebar - Discussions List */}
        <View style={styles.sidebar}>
          {/* Distinct Header */}
          <NeumorphicView
            style={isDark ? 'debossed' : 'embossed'}
            intensity="medium"
            borderRadius={0}
            containerStyle={styles.sidebarHeader}
            contentStyle={{ overflow: 'visible' }} // Allow search bar to be fully visible
          >
            {/* Top row: Title and action buttons */}
            <View style={styles.headerTopRow}>
              <Text style={styles.sidebarTitle}>Messages</Text>
              <View style={styles.headerActions}>
                {!isEditMode ? (
                  <>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => setIsEditMode(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={22} color={theme.colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => {
                        // TODO: Open new chat dialog
                        Alert.alert('New Message', 'New message functionality coming soon');
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => {
                        setSelectedDiscussions(new Set());
                        setIsEditMode(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    {selectedDiscussions.size > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.headerButton}
                          onPress={() => handleEditModeAction('pin')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pin-outline" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.headerButton}
                          onPress={() => handleEditModeAction('delete')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>
            
            {/* Search bar with sunken/indent look */}
            <View style={{ marginBottom: 12, marginTop: 8 }}>
              <NeumorphicView
                style="debossed"
                intensity="medium"
                borderRadius={12}
                containerStyle={styles.searchContainer}
              >
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={theme.colors.mutedForeground} 
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.searchClearButton}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </NeumorphicView>
            </View>
            
            {/* Filter buttons - moved below search with proper spacing */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
                onPress={() => setFilterType('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'personal' && styles.filterButtonActive]}
                onPress={() => setFilterType('personal')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'personal' && styles.filterButtonTextActive]}>
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'group' && styles.filterButtonActive]}
                onPress={() => setFilterType('group')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'group' && styles.filterButtonTextActive]}>
                  Groups
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'unread' && styles.filterButtonActive]}
                onPress={() => setFilterType('unread')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'unread' && styles.filterButtonTextActive]}>
                  Unread
                </Text>
              </TouchableOpacity>
            </View>
          </NeumorphicView>
          <FlatList
            style={styles.discussionsList}
            data={discussions}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshingDiscussions}
                onRefresh={async () => {
                  setRefreshingDiscussions(true);
                  await refetchDiscussions();
                  setRefreshingDiscussions(false);
                }}
                tintColor="#3B82F6"
              />
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedDiscussionId;
              const isEditSelected = selectedDiscussions.has(item.id);
              return (
                <SwipeableDiscussionItem
                  discussion={item}
                  isSelected={isSelected}
                  isEditMode={isEditMode}
                  isEditSelected={isEditSelected}
                  onSelect={() => {
                    if (isEditMode) {
                      toggleDiscussionSelection(item.id);
                    } else {
                      handleSelectDiscussion(item.id);
                    }
                  }}
                  onDelete={() => handleDeleteDiscussion(item.id)}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyStateText}>No conversations yet</Text>
              </View>
            }
          />
        </View>

        {/* Messages Panel */}
        <View style={styles.messagesContainer}>
          {selectedDiscussionId ? (
            <>
              <NeumorphicView
                style={isDark ? 'debossed' : 'embossed'}
                intensity="subtle"
                borderRadius={0}
                containerStyle={styles.messagesHeader}
              >
                {(isMobile || Platform.OS === 'web') && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
                  </TouchableOpacity>
                )}
                <Text style={styles.messagesHeaderTitle}>
                  {selectedDiscussion ? getDiscussionName(selectedDiscussion) : 'Loading...'}
                </Text>
              </NeumorphicView>

              {messagesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <FlatList
                  ref={messagesEndRef}
                  style={styles.messagesList}
                  data={messages} // Messages are reversed: oldest first, newest at bottom
                  keyExtractor={(item) => item.id}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingMessages}
                      onRefresh={async () => {
                        setRefreshingMessages(true);
                        await refetchMessages();
                        setRefreshingMessages(false);
                      }}
                      tintColor="#3B82F6"
                    />
                  }
                  renderItem={({ item }) => {
                    const isCurrentUser = item.author?.user_id === user?.id;
                    const author = item.author || {
                      user_id: item.created_by,
                      user_name: 'Unknown',
                      email: '',
                    };

                    return (
                      <View style={styles.messageItem}>
                        <MessageComponent
                          message={item}
                          isCurrentUser={isCurrentUser}
                          author={author}
                        />
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubble-outline" size={48} color={theme.colors.mutedForeground} />
                      <Text style={styles.emptyStateText}>No messages yet</Text>
                    </View>
                  }
                />
              )}

              {/* Message Input */}
              <View style={styles.inputContainer}>
                {replyingTo && (
                  <View style={styles.replyInputPreview}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.replyInputPreviewText} numberOfLines={1}>
                        Replying to: {replyingTo.content}
                      </Text>
                      <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <Ionicons name="close" size={16} color={theme.colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <TextInput
                  style={styles.input}
                  value={messageInput}
                  onChangeText={setMessageInput}
                  placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                  placeholderTextColor={theme.colors.mutedForeground}
                  multiline
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyStateText}>Select a conversation to start chatting</Text>
            </View>
          )}
        </View>
      </View>

      {/* Long Press Action Sheet */}
      <Modal
        visible={!!longPressedMessage}
        transparent
        animationType="slide"
        onRequestClose={() => setLongPressedMessage(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setLongPressedMessage(null)}
        >
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Message Actions</Text>
            
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => longPressedMessage && handleReply(longPressedMessage)}
            >
              <Ionicons name="arrow-undo" size={24} color={theme.colors.primary} />
              <Text style={styles.actionSheetItemText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => longPressedMessage && handleCopy(longPressedMessage.content)}
            >
              <Ionicons name="copy" size={24} color={theme.colors.primary} />
              <Text style={styles.actionSheetItemText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => longPressedMessage && handleForward(longPressedMessage)}
            >
              <Ionicons name="arrow-forward" size={24} color={theme.colors.primary} />
              <Text style={styles.actionSheetItemText}>Forward</Text>
            </TouchableOpacity>

            <View style={styles.reactionPicker}>
              <Text style={[styles.actionSheetItemText, { width: '100%', marginBottom: 8 }]}>Quick Reactions:</Text>
              {['👍', '👎', '❤️', '😂', '❗', '❓'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => longPressedMessage && handleReact(longPressedMessage, emoji)}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {longPressedMessage && longPressedMessage.author?.user_id === user?.id && (
              <TouchableOpacity
                style={[styles.actionSheetItem, { backgroundColor: theme.colors.destructive + '20' }]}
                onPress={() => {
                  if (longPressedMessage) {
                    handleDelete(longPressedMessage.id);
                  }
                }}
              >
                <Ionicons name="trash" size={24} color={theme.colors.destructive} />
                <Text style={[styles.actionSheetItemText, { color: theme.colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionSheetItem, { marginTop: 20 }]}
              onPress={() => setLongPressedMessage(null)}
            >
              <Text style={[styles.actionSheetItemText, { textAlign: 'center', width: '100%' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

