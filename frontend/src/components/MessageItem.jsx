import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageItem = ({ message, onDelete }) => {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);
    
    // Improved typewriter effect state management
    const [displayedContent, setDisplayedContent] = useState(() => {
        return (isUser || !message.shouldAnimate || message.isError) ? message.content : '';
    });

    useEffect(() => {
        if (!isUser && message.shouldAnimate && !message.isError) {
            if (displayedContent.length < message.content.length) {
                const charDiff = message.content.length - displayedContent.length;
                // Speed up for longer backlogs
                const charsToAdd = charDiff > 50 ? 5 : 1; 
                
                const timeout = setTimeout(() => {
                    setDisplayedContent(message.content.slice(0, displayedContent.length + charsToAdd));
                }, 15);
                return () => clearTimeout(timeout);
            }
        } else {
            setDisplayedContent(message.content);
        }
    }, [message.content, displayedContent, isUser, message.shouldAnimate, message.isError]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    // Correctly check for streaming status based on stable ID prefix or property
    const isStreaming = message.isStreaming === true;

    return (
        <div className={`flex w-full mb-6 ${isStreaming ? '' : 'animate-fade-in'} ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    isUser ? 'bg-primary' : 'bg-surface border border-border'
                }`}>
                    {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>

                <div className="flex flex-col gap-1">
                    <div className={`px-5 py-3 rounded-2xl shadow-sm relative group ${
                        isUser 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-primary/5 border border-primary/20 text-text rounded-tl-none'
                    }`}>
                        <div className="markdown-content leading-relaxed text-[15px]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {displayedContent}
                            </ReactMarkdown>
                            {(isStreaming || displayedContent.length < message.content.length) && (
                                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                            )}
                        </div>

                        <div className={`absolute top-0 ${isUser ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                            <button onClick={handleCopy} className="p-2 bg-surface border border-border rounded-lg hover:text-primary transition-colors text-text/50" title="Copy">
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <span className="text-[11px] text-text/40 px-1">
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
