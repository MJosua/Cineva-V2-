import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { X, Calendar, Bell, ChevronRight, Info } from 'lucide-react';

interface CmsPage {
  page_id: number;
  title: string;
  summary: string;
  content_json: any;
  created_at: string;
  thumbnail?: string;
  slug: string;
}

import { fetchPublicPosts } from '@/api/cms';

const LoginNoticeSidebar = () => {
  const [notices, setNotices] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<CmsPage | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await fetchPublicPosts({ module_key: 'notification' });
        if (response.success) {
          setNotices(response.data || response.pages || []);
        }
      } catch (err) {
        console.error("Failed to fetch notices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const parseBlocks = (contentJson: any) => {
    if (!contentJson) return [];
    try {
      let data = contentJson;
      let iterations = 0;
      while (typeof data === "string" && iterations < 5) {
        try {
          const sanitized = data.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
          data = JSON.parse(sanitized);
          iterations++;
        } catch (e) { break; }
      }
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray(data.blocks)) return data.blocks;
      return [];
    } catch (err) { return []; }
  };

  if (loading && notices.length === 0) {
    return (
      <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse bg-white/50 border-none">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (notices.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4 w-full lg:w-96 shrink-0 lg:max-h-[600px]">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-900/60 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            System Notices
          </h2>
          <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200">
            {notices.length} Posts
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="flex flex-col gap-4 pb-4">
            {notices.map((notice: any) => (
              <Card 
                key={notice.page_id} 
                className={`group hover:shadow-md transition-all cursor-pointer border-none bg-white/80 backdrop-blur-sm border-l-4 overflow-hidden ${
                  notice.is_pinned ? 'border-l-blue-600 shadow-sm ring-1 ring-blue-100' : 'border-l-slate-300'
                }`}
                onClick={() => setSelectedNotice(notice)}
              >
                <CardContent className="p-0 flex">
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {notice.is_pinned === 1 && (
                          <Badge className="bg-blue-600 text-[8px] h-4 px-1 p-0 font-extrabold uppercase tracking-tight">PINNED</Badge>
                        )}
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(notice.created_at)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {notice.summary || "No summary available."}
                    </p>
                    <div className="mt-3 flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                      Read More <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                  
                  {notice.thumbnail && (
                    <div className="flex items-center justify-center p-4">
                      <div className="w-20 h-20 rounded-lg border-2 border-white shadow-md overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200">
                        <img 
                          src={notice.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Notice Detail Modal */}
      <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0 relative">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Notice Detail</span>
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight">
              {selectedNotice?.title}
            </DialogTitle>
            <DialogDescription className="text-blue-100 flex items-center gap-2 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              {selectedNotice?.created_at && formatDate(selectedNotice.created_at)}
            </DialogDescription>
            
            {/* Fixed Close Button (Absolute within relative header) */}
            <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white outline-none ring-offset-blue-600 focus:ring-2 focus:ring-white">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 bg-white overflow-y-auto">
            <div className="space-y-6">
              {selectedNotice && parseBlocks(selectedNotice.content_json).map((block: any, i: number) => {
                const type = block.type || block.id;
                const content = block.content || block.text || '';

                if (type === 'heading') {
                  return <h2 key={i} className="text-xl font-bold text-slate-900 border-b pb-2">{content}</h2>;
                }
                if (type === 'subheading') {
                    return <h3 key={i} className="text-lg font-semibold text-slate-800">{content}</h3>;
                }
                if (type === 'richtext' || type === 'text') {
                  const rawText = block.content || block.text || '';
                  return (
                    <div 
                      key={i} 
                      className="text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none prose-p:my-2 prose-ul:my-2"
                      dangerouslySetInnerHTML={{ 
                        __html: rawText
                          .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3 border shadow-sm mx-auto block" />')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-pink-600 font-mono text-xs">$1</code>')
                          .replace(/\n/g, '<br/>') 
                      }} 
                    />
                  );
                }
                if (type === 'image') {
                  const imgSrc = block.src || block.url || block.content || '';
                  if (!imgSrc) return null;
                  return (
                    <div key={i} className="my-6 rounded-xl overflow-hidden shadow-md border bg-slate-50">
                      <img src={imgSrc} alt={block.alt || 'Notice'} className="w-full h-auto object-contain max-h-[400px]" />
                      {block.caption && <div className="p-2 text-center text-[10px] text-slate-400 italic bg-white border-t">{block.caption}</div>}
                    </div>
                  );
                }
                return null;
              })}

              {!selectedNotice?.content_json && (
                <p className="text-slate-500 italic">No content available for this notice.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginNoticeSidebar;
