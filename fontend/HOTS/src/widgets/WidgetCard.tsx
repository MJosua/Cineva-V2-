import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface WidgetCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    defaultOpen?: boolean;
    glassMorphism?: boolean;
    actions?: ReactNode;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
    title,
    children,
    className = '',
    defaultOpen = true,
    glassMorphism = true,
    actions
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const baseClasses = glassMorphism
        ? 'backdrop-blur-md bg-white/10 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30 shadow-xl'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg';

    return (
        <div className={`rounded-xl overflow-hidden transition-all duration-300 ${baseClasses} ${className}`}>
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 dark:hover:bg-gray-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>

                <ChevronDown
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                />
            </button>

            {/* Content with animated accordion */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-6 py-4 border-t border-white/10 dark:border-gray-700/50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WidgetCard;
