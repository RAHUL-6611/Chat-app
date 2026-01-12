import React from 'react';
import { 
    Plus, 
    MessageSquare, 
    Trash2, 
    User, 
    LogOut,
    X
} from 'lucide-react';

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
                    onClick={createNewChat}
                    className="flex items-center gap-3 w-full p-3 mb-6 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 font-medium active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    New Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-xs font-semibold text-text/40 uppercase tracking-wider">Recent Tickets</span>
                        <button onClick={clearHistory} className="p-1 hover:text-red-500 transition-colors text-text/40" title="Delete All Data">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    
                    {chatSessions.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                            <span className="text-xs text-text/30 italic">No tickets yet</span>
                        </div>
                    ) : (
                        chatSessions.map((session) => (
                            <div 
                                key={session._id}
                                onClick={() => switchChat(session._id)}
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
                    <button onClick={logout} className="flex items-center gap-3 w-full p-3 text-text/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all text-sm font-medium">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
