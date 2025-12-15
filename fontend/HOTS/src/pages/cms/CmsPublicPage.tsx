import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicPage } from '@/api/cms';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WidgetRenderer from "@/widgets/WidgetRenderer";
import { widgetRegistry } from '@/registry/widgetRegistry';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertTriangle, ArrowLeft, FileWarning, Home } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

const renderBlock = (block: any, idx: number) => {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
      const sizes: any = {
        1: 'text-4xl font-bold text-gray-900 mb-6',
        2: 'text-3xl font-semibold text-gray-800 mb-5',
        3: 'text-2xl font-semibold text-gray-800 mb-4',
        4: 'text-xl font-medium text-gray-700 mb-3'
      };
      return <HeadingTag key={idx} className={sizes[block.level || 2]}>{block.text}</HeadingTag>;
    }

    case 'text':
      return (
        <p key={idx} className="text-base leading-relaxed text-gray-700 mb-4">
          {block.text}
        </p>
      );

    case 'html':
      return (
        <div
          key={idx}
          className="prose prose-lg max-w-none mb-4"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'image':
      return (
        <figure key={idx} className="mb-6">
          <img
            src={block.src}
            alt={block.alt || ''}
            className="max-w-full rounded-xl shadow-md"
          />
          {block.alt && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center italic">
              {block.alt}
            </figcaption>
          )}
        </figure>
      );

    case 'divider':
      return (
        <hr
          key={idx}
          className="my-8 border-gray-200"
          style={{
            borderStyle: block.style === 'dashed' ? 'dashed' : block.style === 'none' ? 'none' : 'solid'
          }}
        />
      );

    case 'widget': {
      const widgetConfig = widgetRegistry[block.widgetId];
      if (!widgetConfig) {
        return (
          <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            Widget "{block.widgetId}" not found. It may not be installed yet.
          </div>
        );
      }

      return (
        <ErrorBoundary key={idx} fallbackMessage={`Widget "${widgetConfig.name}" failed to load`}>
          <div className="mb-6">
            <WidgetRenderer config={widgetConfig} data={block.params} />
          </div>
        </ErrorBoundary>
      );
    }

    case 'card-grid':
      return (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.isArray(block.items) && block.items.map((it: any, i: number) => (
            <Card className="hover:shadow-lg transition-shadow" key={i}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{it.title}</h3>
                <p className="text-gray-600 text-sm">{it.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    default:
      return (
        <pre key={idx} className="p-4 bg-gray-100 rounded-lg text-xs overflow-auto mb-4">
          {JSON.stringify(block, null, 2)}
        </pre>
      );
  }
};

export default function CmsPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPublicPage(slug)
      .then(json => setPage(json.ok ? json.page : null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <FileWarning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-6">
              The page "/{slug}" doesn't exist or hasn't been published yet.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                <Home className="w-4 h-4 mr-2" /> Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const blocks = (() => {
    try {
      if (Array.isArray(page.content_json)) return page.content_json;
      if (typeof page.content_json === "string") return JSON.parse(page.content_json);
      return [];
    } catch (err) {
      console.error("Failed to parse content_json:", err);
      return [];
    }
  })();

  return (
    <div className="max-w-4xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {page.title}
            </h1>
            {page.summary && (
              <p className="text-gray-500 text-sm">{page.summary}</p>
            )}
          </div>
        </div>


      </div>

      {/* Page Header */}
      <div className="mb-8">

      </div>

      {/* Page Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>This page has no content yet.</p>
          </div>
        ) : (
          blocks.map(renderBlock)
        )}
      </div>
    </div>
  );
}
