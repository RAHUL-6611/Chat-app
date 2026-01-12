import { useState, useEffect } from 'react';
import { Cpu, Sparkles } from 'lucide-react';

const steps = [
  'Scanning operational signals...',
  'Querying COMPASS intelligence...',
  'Synthesizing actionable outcomes...',
  'Validating via ASH healing...'
];

const ChainOfThought = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full mb-6 animate-fade-in justify-start">
      <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
          <Cpu className="w-5 h-5 text-primary animate-pulse" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="px-5 py-4 rounded-2xl bg-surface border border-border text-text rounded-tl-none shadow-premium relative min-w-[280px] overflow-hidden">
            {/* Title Header */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Processing</span>
            </div>

            {/* Current Step with Progress Bar */}
            <div className="flex flex-col gap-2 relative z-10">
              <span className="text-[13px] font-semibold text-text leading-tight">
                {steps[stepIndex]}
              </span>
              <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Background subtle glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChainOfThought;
