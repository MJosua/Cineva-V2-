import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    isOpen,
    onClose,
    imageUrl,
    title = "Image Preview",
}) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = title || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
                <DialogHeader className="p-4 bg-slate-900/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-white text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        {title}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/10 h-8 w-8"
                            title="Download Image"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/10 h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex items-center justify-center min-h-[50vh] max-h-[90vh] p-4 pt-16">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="max-w-full max-h-[calc(90vh-5rem)] object-contain shadow-2xl"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImagePreviewModal;
