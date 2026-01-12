import { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  loading: boolean;
}

const ChatInput = ({ onSendMessage, startTyping, stopTyping, loading }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = input.trim();
    if (content && !loading) {
      setInput('');
      stopTyping();
      onSendMessage(content);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    startTyping();
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  return (
    <div className="p-3 sm:p-6 bg-transparent">
      <div className="max-w-4xl mx-auto relative group">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1 min-w-0">
            <textarea
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 sm:px-6 sm:py-4 pr-12 sm:pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xl resize-none min-h-[50px] sm:min-h-[56px] max-h-40 placeholder:text-text/30 text-[15px] sm:text-base"
              placeholder="Need help? Type your message here..."
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`
                absolute right-2 top-1.5 sm:top-2 p-2 sm:p-3 rounded-xl transition-all duration-300
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
