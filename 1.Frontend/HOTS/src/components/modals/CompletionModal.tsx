import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface CompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (note: string, tempFileIds: number[]) => void;
    title: string;
    description: React.ReactNode;
    isLoading?: boolean;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isLoading = false,
}) => {
    const [note, setNote] = useState('<p></p>');
    const [tempFileIds, setTempFileIds] = useState<number[]>([]);
    const { toast } = useToast();

    const handleImageUpload = async (file: File): Promise<string> => {
        if (file.size > 3.6 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Maximum file size is 3.6MB',
                variant: 'destructive',
            });
            throw new Error("File too large");
        }

        const token = localStorage.getItem('hots_tokek');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/engine/upload-temp`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success || res.data.ok) {
                const uploadedFile = res.data.data?.[0] || res.data;
                setTempFileIds(prev => [...prev, uploadedFile.upload_id]);
                return uploadedFile.url;
            }
            throw new Error("Failed to upload image");
        } catch (err: any) {
            console.error('Image upload error:', err);
            toast({
                title: 'Upload failed',
                description: err.response?.data?.message || err.message || 'Failed to upload image',
                variant: 'destructive'
            });
            throw err;
        }
    };

    const handleConfirm = () => {
        onConfirm(note, tempFileIds);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Final Timeline Statement (Completion Note):</p>
                    <RichTextEditor
                        value={note}
                        onChange={setNote}
                        onImageUpload={handleImageUpload}
                        placeholder="Add your final statement, images, or documentation here..."
                        minHeight="200px"
                    />
                </div>

                <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={isLoading} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : "Complete Assignment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CompletionModal;
