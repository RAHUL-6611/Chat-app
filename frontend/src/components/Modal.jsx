import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Modal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'confirm', // 'confirm' or 'alert'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    icon: Icon
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    const getIcon = () => {
        if (Icon) return <Icon className="w-6 h-6" />;
        switch (type) {
            case 'confirm': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
            case 'success': return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'error': return <X className="w-6 h-6 text-red-500" />;
            default: return <Info className="w-6 h-6 text-primary" />;
        }
    };

    return createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-text/5 text-text/40 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${isOpen ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}`}>
                        <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse" />
                        {getIcon()}
                    </div>

                    <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
                    <p className="text-text/60 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex items-center gap-3 w-full">
                        {type === 'confirm' && (
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text/60 hover:bg-text/5 transition-all"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                            className={`
                                flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95
                                ${type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary hover:bg-primary-dark shadow-primary/20'}
                                text-white
                            `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
