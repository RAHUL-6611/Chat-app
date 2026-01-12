import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    MessageSquare, 
    Trash2, 
    User, 
    LogOut,
    X,
    Share2
} from 'lucide-react';
import Modal from './Modal';

const Sidebar = ({ 
    sidebarOpen, 
    setSidebarOpen, 
    createNewChat, 
    chatSessions, 
    currentChatId, 
    switchChat, 
    clearHistory, 
    user, 
    logout 
}) => {
    const navigate = useNavigate();
    const [showClearModal, setShowClearModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const handleShare = (e, session) => {
        e.stopPropagation(); // Don't switch chat
        const shareText = `Check out this chat on Ellavox: "${session.lastMessage || 'New Ticket'}"`;
        const shareUrl = `${window.location.origin}/chat/${session._id}`;

        if (navigator.share) {
            navigator.share({
                title: 'Ellavox Chat',
                text: shareText,
                url: shareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${shareText} - ${shareUrl}`);
            setShowShareModal(true);
        }
    };
    return (
        <aside className={`
            fixed lg:static inset-y-0 left-0 w-72 bg-surface border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="h-full flex flex-col p-4">
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <span className="font-bold text-primary">Ellavox</span>
                    <button onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5 text-text/60" />
                    </button>
                </div>

                <button 
                    onClick={() => {
                        createNewChat();
                        // Explicitly signal that we are coming from "New Chat" to prevent
                        // Home.jsx from redirecting us back to the old ID.
                        navigate('/', { replace: true, state: { fromNewChat: true } });
                        setSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 mb-6 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-300 font-semibold active:scale-[0.98] group"
                >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                    New Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-xs font-semibold text-text/40 uppercase tracking-wider">Recent Tickets</span>
                        <button onClick={() => setShowClearModal(true)} className="p-1 hover:text-red-500 transition-colors text-text/40" title="Delete All Data">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <Modal 
                        isOpen={showClearModal}
                        onClose={() => setShowClearModal(false)}
                        onConfirm={clearHistory}
                        title="Clear Chat History"
                        message="Are you sure you want to delete all your conversations? This action cannot be undone."
                        confirmText="Yes, Clear All"
                        type="confirm"
                    />

                    <Modal 
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        title="Chat Link Copied!"
                        message="The link to this conversation has been copied to your clipboard."
                        confirmText="Got it"
                        type="success"
                    />
                    
                    {chatSessions.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                            <span className="text-xs text-text/30 italic">No tickets yet</span>
                        </div>
                    ) : (
                        chatSessions.map((session) => (
                            <div 
                                key={session._id}
                                onClick={() => {
                                    navigate(`/chat/${session._id}`);
                                    setSidebarOpen(false);
                                }}
                                className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all group ${
                                    currentChatId === session._id 
                                        ? 'bg-primary/10 border-primary/20' 
                                        : 'bg-transparent border-transparent hover:bg-text/5'
                                }`}
                            >
                                <MessageSquare className={`w-4 h-4 ${currentChatId === session._id ? 'text-primary' : 'text-text/30'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text truncate">
                                        {session.lastMessage || 'New Ticket'}
                                    </div>
                                    <div className="text-[10px] text-text/30">
                                        {new Date(session.lastTimestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => handleShare(e, session)}
                                    className="p-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                                    title="Share Chat"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-border space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-text/5 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center relative border border-primary/20">
                            <User className="w-6 h-6 text-primary" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-surface rounded-full" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-text truncate">{user?.username}</span>
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Online</span>
                        </div>
                    </div>
                    <button 
                        onClick={logout} 
                        className="flex items-center gap-3 w-full p-3 text-text/40 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all duration-300 text-sm font-semibold group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-text/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
