import { Menu, Search } from 'lucide-react';

interface ChatHeaderProps {
  onMenuClick: () => void;
}

const ChatHeader = ({ onMenuClick }: ChatHeaderProps) => {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-text/5 rounded-lg transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6 text-text/60" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-text mb-0">AI Assistant</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold tracking-widest">Active</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2.5 text-text/40 hover:text-primary transition-colors rounded-xl hover:bg-primary/5">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
