import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicPage } from '@/api/cms';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const renderBlock = (block: any, idx: number) => {
  switch (block.type) {
    case 'heading':
      return <h2 key={idx} className="text-2xl font-semibold">{block.text}</h2>;

    case 'text':
      return <p key={idx} className="prose">{block.text}</p>;

    case 'html':
      return <div key={idx} dangerouslySetInnerHTML={{ __html: block.html }} />;

    case 'image':
      return <img key={idx} src={block.src} alt={block.alt || ''} className="max-w-full" />;

    case 'divider':
      return <hr key={idx} className="my-4" />;

    case 'card-grid':
      return (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.isArray(block.items) && block.items.map((it: any, i: number) => (
            <div className="p-4 border rounded" key={i}>
              <h3 className="font-medium">{it.title}</h3>
              <p>{it.desc}</p>
            </div>
          ))}
        </div>
      );

    default:
      return <pre key={idx}>{JSON.stringify(block, null, 2)}</pre>;
  }
};

export default function CmsPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPublicPage(slug)
      .then(json => setPage(json.ok ? json.page : null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!page) return <div className="p-6">Page not found</div>;

  // 🔥 ALWAYS PARSE content_json if needed
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
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{page.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blocks.map(renderBlock)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
