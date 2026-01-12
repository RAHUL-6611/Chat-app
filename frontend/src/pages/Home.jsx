import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { 
    MessageSquare, 
    Bot,
    Plus,
    History,
    User
} from 'lucide-react';
import MessageItem from '../components/MessageItem';
import ChainOfThought from '../components/ChainOfThought';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';

const Home = () => {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        messages, 
        chatSessions,
        currentChatId,
        loading,
        loadingHistory,
        sendMessage, 
        createNewChat,
        switchChat,
        deleteMessage, 
        clearHistory, 
        typingUser,
        startTyping,
        stopTyping 
    } = useChat();
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const isNewChatActionRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUser, loading]);

    const location = useLocation();

    // Track "New Chat" action intent
    useEffect(() => {
        if (location.state?.fromNewChat) {
            isNewChatActionRef.current = true;
        }
    }, [location.state?.fromNewChat]);

    // 1. URL -> State Sync: The URL is the definitive source
    useEffect(() => {
        // Handle explicit "New Chat" action
        if (isNewChatActionRef.current) {
            if (currentChatId) switchChat(null);
            isNewChatActionRef.current = false; // Reset flag
            return;
        }

        if (id) {
            // Guard against "null" string appearing in URL from bad state syncs
            if (id === 'null') {
                navigate('/', { replace: true });
                return;
            }
            if (id !== currentChatId) {
                switchChat(id);
            }
        } else {
            // No ID in URL (we are at root /)
            // But if CurrentChatId exists, GO THERE. This handles the "First Message" case.
            if (currentChatId) {
                navigate(`/chat/${currentChatId}`, { replace: true });
            }
        }
    }, [id, currentChatId, switchChat, navigate]);


    // Wrapper for New Chat button
    const handleNewChat = () => {
        if (user) localStorage.removeItem(`lastChatId_${user._id}`);
        switchChat(null);
        navigate('/', { replace: true });
    };

    const isAssistantStreaming = messages.length > 0 && 
        messages[messages.length - 1].role === 'assistant' && 
        (messages[messages.length - 1].isStreaming || messages[messages.length - 1]._id.toString().startsWith('streaming-'));

    const suggestions = [
        { icon: Bot, text: "I need to track my pending order" },
        { icon: MessageSquare, text: "What is your return policy?" },
        { icon: Plus, text: "How do I reset my account password?" },
        { icon: History, text: "I have a question about my billing" }
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-text">
            {/* Mobile Menu Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                createNewChat={handleNewChat}
                chatSessions={chatSessions}
                currentChatId={currentChatId}
                switchChat={switchChat}
                clearHistory={clearHistory}
                user={user}
                logout={logout}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative">
                <ChatHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 custom-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto w-full flex flex-col pt-4">
                        {/* Show loading skeleton when fetching history */}
                        {loadingHistory && messages.length === 0 ? (
                            <div className="flex w-full mb-6 animate-fade-in justify-start">
                                <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
                                    <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 animate-pulse">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        <div className="h-4 bg-surface border border-border rounded-lg w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-surface border border-border rounded-lg w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ) : messages.length === 0 && !loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-center mt-32 animate-fade-in">
                                {/* <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 border border-primary/20">
                                    <Bot className="w-10 h-10 text-primary" />
                                </div> */}
                                <h1 className="text-3xl font-bold text-text mb-8">Welcome!</h1>
                                {/* <p className="text-text/50 max-w-md mx-auto leading-relaxed mb-10">
                                    I am your Agentic AI Worker. Use the suggestions below to explore my operational capabilities.
                                </p> */}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => sendMessage(suggestion.text)}
                                            className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group text-left shadow-sm active:scale-[0.98]"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <suggestion.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium text-text/80 group-hover:text-text transition-colors leading-tight">
                                                {suggestion.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        
                        {messages.map((msg) => (
                            <MessageItem 
                                key={msg._id || Math.random()} 
                                message={msg} 
                                onDelete={deleteMessage}
                            />
                        ))}

                        {/* Chain of Thought Loader */}
                        {loading && !isAssistantStreaming && <ChainOfThought />}

                        {typingUser && (
                            <div className="flex gap-3 mb-6 animate-fade-in animate-bounce-subtle">
                                <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="bg-surface border border-border px-4 py-2 rounded-2xl flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-[11px] text-text/50 font-medium">{typingUser} is typing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <ChatInput 
                    onSendMessage={sendMessage}
                    startTyping={startTyping}
                    stopTyping={stopTyping}
                    loading={loading}
                />
            </main>
        </div>
    );
};

export default Home;
