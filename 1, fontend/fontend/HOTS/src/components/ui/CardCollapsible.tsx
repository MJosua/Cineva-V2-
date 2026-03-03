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
    color = "bg-muted/50"
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    color?: string;
}) => {
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <div className={cn("rounded-lg border shadow-sm bg-card  text-card-foreground", className)}>
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center justify-between cursor-pointer ${color } border-b p-4 hover:bg-muted transition`}

            >

                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="text-muted-foreground">
                    {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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
