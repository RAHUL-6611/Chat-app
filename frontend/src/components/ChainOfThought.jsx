import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Brain, Cpu, Database, ShieldCheck } from 'lucide-react';

const steps = [
    { icon: Search, text: 'Scanning Operational Signals...' },
    { icon: Database, text: 'Querying COMPASS Intelligence...' },
    { icon: Brain, text: 'Synthesizing Actionable Outcomes...' },
    { icon: ShieldCheck, text: 'Validating via ASH Healing...' }
];

const ChainOfThought = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex w-full mb-6 animate-fade-in justify-start">
            <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Cpu className="w-5 h-5 text-primary animate-pulse" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="px-5 py-4 rounded-2xl bg-surface border border-border text-text rounded-tl-none min-w-[280px] shadow-xl relative overflow-hidden">
                        {/* Background subtle glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Ellavox Operational Intelligence</span>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index === currentStep;
                                const isPast = index < currentStep;

                                return (
                                    <div 
                                        key={index}
                                        className={`flex items-center gap-3 transition-all duration-700 ease-out ${
                                            isActive ? 'opacity-100 translate-x-2' : isPast ? 'opacity-40' : 'opacity-10'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-all duration-500 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-primary/5 text-primary/40'}`}>
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-spin-slow' : ''}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] tracking-tight ${isActive ? 'font-bold text-text' : 'text-text/60'}`}>
                                                {step.text}
                                            </span>
                                            {isActive && (
                                                <div className="h-0.5 w-full bg-primary/20 mt-1 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary animate-progress-indefinite" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">Processing</span>
                        <span className="text-[10px] text-text/20">•</span>
                        <span className="text-[10px] text-text/30 italic">Worker is calculating business outcomes...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChainOfThought;
