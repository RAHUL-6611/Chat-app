import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-3 right-6 p-3 rounded-xl glass transition-all duration-500 active:scale-95 z-50 group overflow-hidden
        ${theme === 'light' 
          ? 'hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-500/20' 
          : 'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] border-primary/20'}
      `}
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5">
        <Moon className={`
          absolute inset-0 w-5 h-5 transition-all duration-500 transform
          ${theme === 'light' ? 'scale-100 rotate-0 text-slate-700' : 'scale-0 -rotate-90 opacity-0 text-primary'}
        `} />
        <Sun className={`
          absolute inset-0 w-5 h-5 transition-all duration-500 transform
          ${theme === 'dark' ? 'scale-100 rotate-0 text-yellow-400' : 'scale-0 rotate-90 opacity-0 text-amber-500'}
        `} />
      </div>
      
      {/* Subtle background glow effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
        ${theme === 'light' ? 'bg-amber-500' : 'bg-primary'}
      `} />
    </button>
  );
};

export default ThemeToggle;
