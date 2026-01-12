import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [chatSessions, setChatSessions] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(() => {
        const globalId = localStorage.getItem('currentChatId') || 'default';
        if (user) {
            return localStorage.getItem(`lastChatId_${user._id}`) || globalId;
        }
        return globalId;
    });
    const [loading, setLoading] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [error, setError] = useState(null);
    const socketRef = useRef();

    // Local Storage Fallback for offline/failed messages
    const [offlineQueue, setOfflineQueue] = useState([]);

    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`offline_msgs_${user._id}`);
            if (saved) setOfflineQueue(JSON.parse(saved));
            
            const lastId = localStorage.getItem(`lastChatId_${user._id}`);
            if (lastId) setCurrentChatId(lastId);
        }
    }, [user]);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await api.get('/chat/sessions');
            setChatSessions(res.data);
        } catch (err) {
            console.error('Sessions fetch error:', err);
        }
    }, []);

    const fetchHistory = useCallback(async (chatId) => {
        try {
            const res = await api.get(`/chat/history?chatId=${chatId || currentChatId}`);
            const localForThisChat = offlineQueue.filter(m => m.chatId === (chatId || currentChatId));
            setMessages([...res.data, ...localForThisChat]);
        } catch (err) {
            console.error('History fetch error:', err);
        }
    }, [currentChatId, offlineQueue]);

    useEffect(() => {
        if (user) {
            socketRef.current = io(SOCKET_URL, {
                withCredentials: true,
            });

            socketRef.current.on('typing', (data) => {
                if (data.userId !== user._id) {
                    setTypingUser(data.username);
                }
            });

            socketRef.current.on('stop_typing', () => {
                setTypingUser(null);
            });

            socketRef.current.on('message_received', (data) => {
                setMessages(prev => {
                    // Find the optimistic temp message and replace it
                    const optimisticIndex = prev.findIndex(m => m._id.startsWith('temp-') && m.content === data.userMessage.content);
                    if (optimisticIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[optimisticIndex] = data.userMessage;
                        return newMessages;
                    }
                    return [...prev, data.userMessage];
                });
            });

            socketRef.current.on(`chat_chunk_${user._id}`, (data) => {
                if (data.finished) {
                    if (data.aiMessage) {
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            // Check for both legacy and new stable ID patterns
                            if (last && last.role === 'assistant' && (last.isStreaming || last._id.startsWith('streaming-'))) {
                                return [...prev.slice(0, -1), { 
                                    ...data.aiMessage, 
                                    _id: last._id, // KEEP STABLE KEY TO PREVENT FLICKER
                                    dbId: data.aiMessage._id, // Store real ID for potential delete/share
                                    isStreaming: false, 
                                    shouldAnimate: false // Content is already fully streamed, no need to type again
                                }];
                            }
                            return prev;
                        });
                    }
                    setLoading(false);
                    fetchSessions();
                } else {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'assistant' && (last.isStreaming || last._id.startsWith('streaming-'))) {
                            return [
                                ...prev.slice(0, -1),
                                { ...last, content: last.content + data.content }
                            ];
                        } else {
                            // Unique stable ID for this specific streaming response
                            const uniqueStreamingId = `streaming-${Date.now()}`;
                            return [...prev, { 
                                _id: uniqueStreamingId, 
                                role: 'assistant', 
                                content: data.content, 
                                isStreaming: true, 
                                shouldAnimate: true 
                            }];
                        }
                    });
                }
            });

            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [user, fetchSessions]);

    useEffect(() => {
        if (user) {
            fetchHistory();
            fetchSessions();
        }
    }, [user, currentChatId, fetchHistory, fetchSessions]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`offline_msgs_${user._id}`, JSON.stringify(offlineQueue));
        }
    }, [offlineQueue, user]);

    const sendMessage = (content) => {
        setLoading(true);
        setError(null);

        const tempId = 'temp-' + Date.now();
        const tempUserMsg = {
            _id: tempId,
            content,
            role: 'user',
            chatId: currentChatId,
            createdAt: new Date().toISOString()
        };

        // Aggressive optimism at state level
        setMessages(prev => [...prev, tempUserMsg]);
        
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('send_message', { 
                content, 
                chatId: currentChatId 
            });
        } else {
            // Mark as offline if we can't send
            const offlineMsg = { ...tempUserMsg, isOffline: true };
            setMessages(prev => prev.map(m => m._id === tempId ? offlineMsg : m));
            setOfflineQueue(prev => [...prev, offlineMsg]);
            setLoading(false);
            setError("Something went wrong. Your message has been saved locally.");
        }
    };

    const createNewChat = () => {
        const newId = Math.random().toString(36).substring(2, 11);
        setCurrentChatId(newId);
        setMessages([]);
        if (user) {
            localStorage.setItem(`lastChatId_${user._id}`, newId);
        }
        fetchSessions();
    };

    const switchChat = (chatId) => {
        setCurrentChatId(chatId);
        if (user) {
            localStorage.setItem(`lastChatId_${user._id}`, chatId);
        }
    };

    const deleteMessage = async (id) => {
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

    const clearHistory = async () => {
        if (window.confirm('Are you sure you want to clear all chat history?')) {
            try {
                await api.delete('/chat/history');
                setMessages([]);
                setChatSessions([]);
                setOfflineQueue([]);
                localStorage.removeItem(`offline_msgs_${user._id}`);
                createNewChat();
            } catch (err) {
                console.error('Clear error:', err);
            }
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
            messages,
            chatSessions,
            loading,
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

export const useChat = () => useContext(ChatContext);
