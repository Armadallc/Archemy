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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // Listen for screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Determine if we're on a mobile device (width < 768px)
  const isMobile = screenData.width < 768;


  // Fetch discussions
  const { data: discussionsRaw = [], isLoading: discussionsLoading } = useQuery({
    queryKey: ['discussions'],
    queryFn: async () => {
      const response = await apiClient.request<Discussion[]>('/api/discussions');
      return response;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Sort discussions: pinned first, then by last message time (newest first)
  const discussions = React.useMemo(() => {
    return [...discussionsRaw].sort((a, b) => {
      // Pinned discussions first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by last message time (newest first)
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : (a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0);
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : (b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0);
      return bTime - aTime; // Descending order (newest first)
    });
  }, [discussionsRaw]);

  // Fetch messages for selected discussion
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
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
  const SwipeableDiscussionItem = ({ discussion, isSelected, onSelect, onDelete }: {
    discussion: Discussion;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
  }) => {
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const [swipedDiscussionId, setSwipedDiscussionId] = useState<string | null>(null);
    
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
        },
        onPanResponderGrant: () => {
          if (swipedDiscussionId && swipedDiscussionId !== discussion.id) {
            setSwipedDiscussionId(null);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            const clampedDx = Math.max(gestureState.dx, -120);
            swipeAnim.setValue(clampedDx);
          } else if (gestureState.dx > 0 && swipeAnim._value < 0) {
            swipeAnim.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -80) {
            Animated.spring(swipeAnim, {
              toValue: -120,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
            setSwipedDiscussionId(discussion.id);
          } else {
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
            setSwipedDiscussionId(null);
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setSwipedDiscussionId(null);
        },
      })
    ).current;

    return (
      <View style={styles.swipeableDiscussionContainer}>
        {/* Swipe actions - behind the discussion item */}
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeAction, styles.swipeActionDelete]}
            onPress={() => {
              onDelete();
              Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
              setSwipedDiscussionId(null);
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
            ]}
            onPress={() => {
              if (swipedDiscussionId === discussion.id) {
                Animated.spring(swipeAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
                setSwipedDiscussionId(null);
              } else {
                onSelect();
              }
            }}
          >
            <Text style={styles.discussionName}>
              {getDiscussionName(discussion)}
            </Text>
            {discussion.lastMessage && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                {/* Sender avatar */}
                {discussion.lastMessage.author && (
                  <View style={styles.listAvatarContainer}>
                    {getAvatarUrl(discussion.lastMessage.author.avatar_url) ? (
                      <Image 
                        source={{ uri: getAvatarUrl(discussion.lastMessage.author.avatar_url)! }} 
                        style={styles.listAvatar}
                      />
                    ) : (
                      <View style={[styles.listAvatar, styles.listAvatarPlaceholder]}>
                        <Text style={styles.listAvatarText}>
                          {getUserInitials(discussion.lastMessage.author)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
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
      borderRightWidth: (isMobile || Platform.OS === 'web') ? 0 : 1,
      borderRightColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      display: (isMobile || Platform.OS === 'web') && viewingChatThread ? 'none' : 'flex',
    },
    sidebarHeader: {
      padding: 16,
      marginTop: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sidebarTitle: {
      ...theme.typography.heading,
      fontSize: 30,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    discussionsList: {
      flex: 1,
    },
    discussionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    discussionItemSelected: {
      backgroundColor: theme.colors.primary + '10',
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
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
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
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
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
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>CHATBOX</Text>
          </View>
          <FlatList
            style={styles.discussionsList}
            data={discussions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedDiscussionId;
              return (
                <SwipeableDiscussionItem
                  discussion={item}
                  isSelected={isSelected}
                  onSelect={() => handleSelectDiscussion(item.id)}
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
          {/* New Chat Button */}
          <View style={styles.newChatButtonContainer}>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => {
                // TODO: Open new chat dialog
                Alert.alert('New Chat', 'New chat functionality coming soon');
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.newChatButtonText}>New Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Panel */}
        <View style={styles.messagesContainer}>
          {selectedDiscussionId ? (
            <>
              <View style={styles.messagesHeader}>
                {(isMobile || Platform.OS === 'web') && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                  >
                    <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
                  </TouchableOpacity>
                )}
                <Text style={styles.messagesHeaderTitle}>
                  {selectedDiscussion ? getDiscussionName(selectedDiscussion) : 'Loading...'}
                </Text>
              </View>

              {messagesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <FlatList
                  ref={messagesEndRef}
                  style={styles.messagesList}
                  data={messages} // Backend returns newest first (descending)
                  keyExtractor={(item) => item.id}
                  inverted={true} // Inverted shows newest at bottom (standard chat pattern)
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

