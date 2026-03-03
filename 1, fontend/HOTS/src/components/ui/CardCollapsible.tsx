import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const CardCollapsible = ({
    title,
    description,
    children,
    defaultOpen = false,
    className,
    color = "bg-muted/50",
    icon: Icon,
    headerExtra
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    color?: string;
    icon?: React.ElementType;
    headerExtra?: React.ReactNode;
}) => {
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <div className={cn("rounded-lg border shadow-sm bg-card text-card-foreground overflow-hidden", className)}>
            <div
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center justify-between cursor-pointer border-b p-4 hover:bg-muted/80 transition-colors",
                    color
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-semibold leading-none">{title}</h3>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {headerExtra && <div onClick={(e) => e.stopPropagation()}>{headerExtra}</div>}
                    <div className="text-muted-foreground">
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
