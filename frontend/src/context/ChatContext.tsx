import { createContext, use, useState, useEffect, useCallback, useRef, useOptimistic, startTransition, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import api from '../api/api';
import { useAuth } from './AuthContext';
import { Message, ChatSession, ChatContextType } from '../types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:5001');

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentChatIdRef = useRef<string | null>(currentChatId);

  // Sync ref with state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  // Local Storage Fallback for offline/failed messages
  const [offlineQueue, setOfflineQueue] = useState<Message[]>([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`offline_msgs_${user._id}`);
      if (saved) setOfflineQueue(JSON.parse(saved));
    }
  }, [user]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get<ChatSession[]>('/chat/sessions');
      setChatSessions(res.data);
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  }, []);

  const fetchHistory = useCallback(async (chatId?: string | null) => {
    const targetId = chatId || currentChatId;
    
    // Prevent repeated fetches for the same ID within a short window
    if (!targetId || targetId === 'default' || targetId.startsWith('new-')) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }
    
    setLoadingHistory(true);
    try {
      const res = await api.get<Message[]>(`/chat/history?chatId=${targetId}`);
      
      // Stale Check: Ensure we generally only update if we are still on the same chat ID
      // or if we were fetching specifically for the current ID.
      if (targetId === currentChatIdRef.current) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentChatId]);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.on('typing', (data: { userId: string; username: string }) => {
      if (data.userId !== user._id) {
        setTypingUser(data.username);
      }
    });

    socketRef.current.on('stop_typing', () => {
      setTypingUser(null);
    });

    socketRef.current.on('message_received', (data: { userMessage: Message }) => {
      // If we are on "New Chat" (no URL ID) but receive a message with a real ID, 
      // we should silently update the URL to match this new reality.
      if (!currentChatId && data.userMessage.chatId && data.userMessage.chatId !== 'null') {
        setCurrentChatId(data.userMessage.chatId);
        window.history.pushState({}, '', `/chat/${data.userMessage.chatId}`);
      }

      // Single Source of Truth: We only add the message when the server confirms it.
      // React's useOptimistic will automatically discard the calculated optimistic state 
      // and replace it with this new real state.
      setMessages(prev => {
        // Safety check: ignore if already exists
        if (prev.some(m => m._id === data.userMessage._id)) {
          return prev;
        }
        return [...prev, data.userMessage];
      });
    });

    socketRef.current.on(`chat_chunk_${user._id}`, (data: any) => {
      if (data.finished) {
        if (data.error && data.fallbackContent) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            // If we already started streaming, update the existing message
            if (last && last.role === 'assistant' && (last.isStreaming || last._id.startsWith('streaming-'))) {
              return [...prev.slice(0, -1), { 
                ...last, 
                content: last.content + "\n\n" + data.fallbackContent,
                isStreaming: false,
                isError: true 
              }];
            }
            // Otherwise add a new error message
            return [...prev, {
              _id: `err-${Date.now()}`,
              role: 'assistant' as const,
              content: data.fallbackContent,
              chatId: currentChatId || 'default',
              createdAt: new Date().toISOString(),
              isStreaming: false,
              isError: true
            }];
          });
        } else if (data.aiMessage) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && (last.isStreaming || last._id.startsWith('streaming-'))) {
              return [...prev.slice(0, -1), { 
                ...data.aiMessage, 
                _id: last._id, 
                dbId: data.aiMessage._id,
                isStreaming: false, 
                shouldAnimate: false
              }];
            }
            return prev;
          });
        }
        setLoading(false);
        fetchSessions();
      } else {
        setMessages(prev => {
          // SAFETY CHECK: Only start streaming if we have at least one user message
          // This prevents AI response from appearing before user message in rare race conditions
          const hasUserMessage = prev.some(m => m.role === 'user');
          if (!hasUserMessage) {
            console.warn('Received AI chunk before user message - buffering');
            return prev;
          }

          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && (last.isStreaming || last._id.startsWith('streaming-'))) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + data.content }
            ];
          } else {
            // Unique stable ID for this specific streaming response
            const uniqueStreamingId = `streaming-${crypto.randomUUID()}`;
            return [...prev, { 
              _id: uniqueStreamingId, 
              role: 'assistant' as const, 
              content: data.content, 
              chatId: currentChatId || 'default',
              createdAt: new Date().toISOString(),
              isStreaming: true, 
              shouldAnimate: true 
            }];
          }
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, fetchSessions, currentChatId]);

  // Unified effect for data synchronization
  useEffect(() => {
    if (user) {
      // Fetch sessions once and whenever user changes
      fetchSessions();
    }
  }, [user, fetchSessions]);

  useEffect(() => {
    if (user) {
      if (currentChatId) {
        fetchHistory(currentChatId);
      } else {
        // FORCE RESET: Distinctly clear messages when entering "New Chat"
        // This clean slate is critical for useOptimistic to reset its base
        setMessages([]);
      }
    }
  }, [user, currentChatId, fetchHistory]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`offline_msgs_${user._id}`, JSON.stringify(offlineQueue));
    }
  }, [offlineQueue, user]);

  // React 19 useOptimistic Hook
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  const sendMessage = (content: string) => {
    setLoading(true);
    setError(null);

    // Generate a new ID if we are in "New Chat" mode (null ID)
    let activeChatId = currentChatId;
    if (!activeChatId) {
      activeChatId = Math.random().toString(36).substring(2, 11);
      setCurrentChatId(activeChatId);

      if (user) {
        localStorage.setItem(`lastChatId_${user._id}`, activeChatId);
      }
    }

    const tempUserMsg: Message = {
      _id: crypto.randomUUID(),
      content,
      role: 'user',
      chatId: activeChatId,
      createdAt: new Date().toISOString(),
      isOptimistic: true 
    };
    
    // 1. Optimistic Update (Instant feedback) - WRAPPED IN TRANSITION for React 19
    startTransition(() => {
      addOptimisticMessage(tempUserMsg);
    });
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', { 
        content, 
        chatId: activeChatId 
      });
    } else {
      // Error handling remains ...
      setError("Connection lost. Please try again.");
      setLoading(false);
    }
  };

  const createNewChat = useCallback(() => {
    // 1. Reset State
    setCurrentChatId(null);
    setMessages([]);

    // 2. Clear Persistence (with small delay to ensure rendering sync)
    if (user) {
      setTimeout(() => {
        localStorage.removeItem(`lastChatId_${user._id}`);
      }, 0);
    }
  }, [user]);

  const switchChat = useCallback((chatId: string) => {
    // Prevent setting the state to common error strings
    if (chatId === 'null' || chatId === 'undefined') {
      setCurrentChatId(null);
      return;
    }

    setCurrentChatId(chatId);
    if (user && chatId) {
      localStorage.setItem(`lastChatId_${user._id}`, chatId);
    }
  }, [user]);

  const deleteMessage = async (id: string): Promise<void> => {
    const msg = messages.find(m => m._id === id);
    const actualId = msg?.dbId || id;

    if (actualId.toString().startsWith('temp-') || actualId.toString().startsWith('local-') || actualId.toString().startsWith('err-') || actualId.toString().startsWith('streaming-')) {
      setOfflineQueue(prev => prev.filter(m => m._id !== id));
      setMessages(prev => prev.filter(m => m._id !== id));
      return;
    }
    try {
      await api.delete(`/chat/message/${actualId}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      fetchSessions();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const clearHistory = async (): Promise<void> => {
    try {
      await api.delete('/chat/history');
      setMessages([]);
      setChatSessions([]);
      setOfflineQueue([]);
      if (user) {
        localStorage.removeItem(`offline_msgs_${user._id}`);
      }
      createNewChat();
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const startTyping = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('typing', { userId: user._id, username: user.username });
    }
  };

  const stopTyping = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('stop_typing', { userId: user._id });
    }
  };

  return (
    <ChatContext.Provider value={{
      messages: optimisticMessages, // Expose the optimistic version to the UI
      chatSessions,
      loading,
      loadingHistory,
      typingUser,
      error,
      currentChatId,
      sendMessage,
      createNewChat,
      switchChat,
      deleteMessage,
      clearHistory,
      startTyping,
      stopTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = use(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
