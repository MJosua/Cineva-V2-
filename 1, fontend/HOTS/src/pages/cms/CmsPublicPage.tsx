import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPublicPage } from '@/api/cms';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

const renderBlock = (block: any, idx: number) => {
  // Support simple string blocks
  if (typeof block === 'string') {
    return <p key={idx} className="text-slate-600 leading-relaxed mb-4">{block}</p>;
  }

  if (!block || typeof block !== 'object') return null;

  switch (block.type) {
    case 'heading':
      return <h2 key={idx} className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">{block.text || block.content || block.title}</h2>;

    case 'richtext':
    case 'text':
      const text = block.content || block.text || '';
      return (
        <div 
          key={idx} 
          className="text-slate-600 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ 
            __html: text
              .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4 border shadow-sm mx-auto block" />')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-pink-600 font-mono text-xs">$1</code>')
              .replace(/\n/g, '<br/>') 
          }} 
        />
      );

    case 'html':
      return <div key={idx} className="cms-html-block" dangerouslySetInnerHTML={{ __html: block.html || block.content }} />;

    case 'image':
      return (
        <figure key={idx} className="my-6">
          <img src={block.src || block.url} alt={block.alt || ''} className="rounded-lg border shadow-sm max-w-full h-auto mx-auto" />
          {block.caption && <figcaption className="text-center text-xs text-slate-400 mt-2 italic">{block.caption}</figcaption>}
        </figure>
      );

    case 'divider':
      return <hr key={idx} className="my-8 border-slate-100" />;

    case 'card-grid':
      return (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          {Array.isArray(block.items) && block.items.map((it: any, i: number) => (
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md transition-all group" key={i}>
              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">{it.title || it.heading}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{it.desc || it.content || it.text}</p>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div key={idx} className="p-4 bg-slate-50 rounded border border-dashed text-xs font-mono text-slate-400">
          Unknown block type: {block.type}
          <pre className="mt-2">{JSON.stringify(block, null, 2)}</pre>
        </div>
      );
  }
};

export default function CmsPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    fetchPublicPage(slug)
      .then(json => {
        if (isMounted) {
          if (json.ok) {
            setPage(json.page);
          } else {
            setError(json.message || "Page not found");
          }
        }
      })
      .catch(err => {
        if (isMounted) setError("Network error occurred");
        console.error("CMS FETCH ERROR:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug]);

  const blocks = React.useMemo(() => {
    if (!page || !page.content_json) return [];
    
    try {
      let data = page.content_json;
      let iterations = 0;
      
      // Recursive parse handles both string and object data
      while (typeof data === "string" && iterations < 5) {
        try {
          const sanitized = data.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
          data = JSON.parse(sanitized);
          iterations++;
        } catch (e) {
          break; // Stop parsing if it's not JSON
        }
      }
      
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray(data.blocks)) return data.blocks;
      
      return [];
    } catch (err) {
      console.error("CMS PARSE ERROR:", err);
      return [];
    }
  }, [page]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-medium">Loading content...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-24">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{error || "Page Not Found"}</h2>
        <p className="text-slate-500 mb-8">The documentation you are looking for might have been moved or deleted.</p>
        <Button asChild variant="outline">
          <Link to="/help-center">Return to Help Center</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-10 text-white relative">
           <div className="absolute top-0 right-0 p-10 opacity-5">
             <FileText className="w-32 h-32" />
           </div>
           <Badge className="bg-blue-500 hover:bg-blue-600 border-none mb-4 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
             {page.module_key?.replace('_', ' ') || 'Documentation'}
           </Badge>
           <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
        </div>
        <CardContent className="px-8 py-10">
          <div className="space-y-4">
            {blocks.map(renderBlock)}
          </div>
        </CardContent>
      </Card>
      <div className="mt-12 text-center text-xs text-slate-400 border-t pt-8">
        Last updated: {new Date(page.updated_at || page.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
