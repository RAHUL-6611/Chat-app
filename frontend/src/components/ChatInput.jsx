import React, { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ onSendMessage, startTyping, stopTyping, loading }) => {
    const [input, setInput] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const content = input.trim();
        if (content && !loading) {
            setInput('');
            stopTyping();
            onSendMessage(content);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        startTyping();
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    };

    return (
        <div className="p-4 sm:p-6 bg-transparent">
            <div className="max-w-4xl mx-auto relative group">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <div className="relative flex-1">
                        <textarea
                            className="w-full bg-surface border border-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xl resize-none min-h-[56px] max-h-40 placeholder:text-text/30"
                            placeholder="Need help? Type your message here..."
                            rows={1}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className={`
                                absolute right-2 top-2 p-3 rounded-xl transition-all duration-300
                                ${input.trim() && !loading ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-95' : 'bg-text/5 text-text/20'}
                            `}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatInput;
