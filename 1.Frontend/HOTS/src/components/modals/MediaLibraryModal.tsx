import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Upload, Check, Trash2, Image as ImageIcon, 
  Loader2, Filter, X, Plus
} from 'lucide-react';
import { adminListMedia, adminMediaUploadTemp, adminMediaFinalize, adminDeleteMedia } from '@/api/cms';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaItem {
  media_id: number;
  file_name: string;
  file_url: string;
  folder: string;
  tags: string[] | string | null;
  created_at: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect, title = "Media Library" }: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await adminListMedia({ search });
      if (res.ok) {
        setMedia(res.data || []);
      }
    } catch (error) {
      console.error("Fetch media error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedId(null);
    }
  }, [isOpen, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to temp
      const tempRes = await adminMediaUploadTemp(file);
      if (tempRes.ok) {
        // 2. Finalize
        const finalizeRes = await adminMediaFinalize({
          upload_id: tempRes.upload_id,
          file_name: file.name,
          folder: 'general'
        });

        if (finalizeRes.ok) {
          toast({ title: "Success", description: "Image uploaded successfully" });
          fetchMedia();
        } else {
          toast({ title: "Error", description: finalizeRes.message, variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = () => {
    const selected = media.find(m => m.media_id === selectedId);
    if (selected) {
      onSelect(selected.file_url);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await adminDeleteMedia(id);
      if (res.ok) {
        toast({ title: "Deleted", description: "Image removed from library" });
        if (selectedId === id) setSelectedId(null);
        fetchMedia();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white" aria-describedby={undefined}>
        <DialogHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              {title}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search images..." 
                  className="pl-9 h-9 bg-white border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => document.getElementById('media-upload')?.click()}
                disabled={uploading}
                className="h-9 gap-2 shadow-sm bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
              </Button>
              <input 
                id="media-upload" 
                type="file" 
                hidden 
                accept="image/*"
                onChange={handleUpload}
              />
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {loading && media.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium">No images found</p>
              <p className="text-sm">Upload your first image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item) => (
                <div 
                  key={item.media_id}
                  onClick={() => setSelectedId(item.media_id)}
                  className={`group relative cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
                    selectedId === item.media_id 
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg scale-[0.98]' 
                      : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <AspectRatio ratio={1}>
                    <img 
                      src={item.file_url} 
                      alt={item.file_name} 
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  
                  {/* Overlay tags/info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate font-medium">{item.file_name}</p>
                  </div>

                  {/* Actions */}
                  {selectedId === item.media_id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => handleDelete(e, item.media_id)}
                    className="absolute top-2 left-2 bg-red-50 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-slate-50/50">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-slate-500 italic">
              {selectedId ? "One image selected" : "Choose an image from the library"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleSelect} 
                disabled={!selectedId}
                className="px-10 bg-blue-600 hover:bg-blue-700 shadow-md"
              >
                Insert Image
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
