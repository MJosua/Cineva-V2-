import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminListPages } from '@/api/cms';
import { Button } from '@/components/ui/button';

export default function CmsAdminList() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    adminListPages().then(json => {
      if (json.ok) setPages(json.pages || []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">CMS Pages</h1>
        <div>
          <Button onClick={() => nav('/admin/cms/new')}>Create Page</Button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div key={p.page_id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-sm text-muted-foreground">{p.slug} • {p.status}</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/cms/edit/${p.page_id}`} className="btn">Edit</Link>
                <a href={`/hots/page/${encodeURIComponent(p.slug)}`} target="_blank" rel="noreferrer" className="btn btn-ghost">View</a>
              </div>
            </div>
          ))}
          {pages.length === 0 && <div>No pages yet.</div>}
        </div>
      )}
    </div>
  );
}
