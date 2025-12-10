import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetPage, adminSavePage } from '@/api/cms';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/config/sourceConfig';

const DEFAULT_BLOCK_TYPES = [
  { key: 'heading', title: 'Heading', sample: { type: 'heading', text: 'Heading text', level: 2 } },
  { key: 'text', title: 'Text', sample: { type: 'text', text: 'Some paragraph text' } },
  { key: 'html', title: 'HTML', sample: { type: 'html', html: '<p>HTML content</p>' } },
  { key: 'image', title: 'Image', sample: { type: 'image', src: 'https://via.placeholder.com/600x300', alt: 'Image alt' } },
  { key: 'divider', title: 'Divider', sample: { type: 'divider', style: 'solid' } },
];

// small helper to deep clone
const clone = (v: any) => JSON.parse(JSON.stringify(v));

export default function CmsAdminEditor() {
  const { id } = useParams<{ id?: string }>();
  const nav = useNavigate();

  const [page, setPage] = useState<any>({ slug: '', title: '', summary: '', content_json: [] });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // load page
  useEffect(() => {
    async function load() {
      if (!id || id === 'new') return;
      setLoading(true);
      try {
        const json = await adminGetPage(Number(id));
        if (json.ok) {
          const p = clone(json.page);
          // ensure content_json parsed
          if (typeof p.content_json === 'string') {
            try { p.content_json = JSON.parse(p.content_json); } catch { p.content_json = []; }
          }
          setPage(p);
        } else {
          // show failure
          alert('Failed to load page: ' + (json.message || 'unknown'));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ensure selectedIndex resets when switching page
  useEffect(() => {
    setSelectedIndex(null);
  }, [page.page_id]);

  // ---------------------------------------------------
  // Block helpers
  // ---------------------------------------------------
  const addBlock = (sample: any) => {
    setPage((p: any) => ({ ...p, content_json: [...(p.content_json || []), clone(sample)] }));
    // select new block after short delay
    setTimeout(() => setSelectedIndex((page.content_json || []).length), 50);
  };

  const updateBlock = (idx: number, updated: any) => {
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr[idx] = clone(updated);
      return { ...p, content_json: arr };
    });
  };

  const removeBlock = (idx: number) => {
    if (!confirm('Delete this block?')) return;
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr.splice(idx, 1);
      return { ...p, content_json: arr };
    });
    setSelectedIndex(null);
  };

  const duplicateBlock = (idx: number) => {
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr.splice(idx + 1, 0, clone(arr[idx]));
      return { ...p, content_json: arr };
    });
    setSelectedIndex(idx + 1);
  };

  const moveBlock = (from: number, to: number) => {
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      if (to < 0 || to >= arr.length) return p;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...p, content_json: arr };
    });
    setSelectedIndex(to);
  };

  // simple upload handler that uses FileReader to produce dataURL and store client-side
  const handleImageFile = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      onDone(String(reader.result));
    };
    reader.onerror = () => {
      alert('Image read failed');
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------
  // Save
  // ---------------------------------------------------
  const save = async (publish = false) => {
    if (!page.slug || page.slug.trim() === '') {
      alert('Slug cannot be empty');
      return;
    }
    const payload = {
      page_id: page.page_id || null,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      content_json: page.content_json || [],
      status: publish ? 'published' : (page.status || 'draft'),
    };

    try {
      const json = await adminSavePage(payload);
      if (!json) {
        alert('No response from server');
        return;
      }
      if (json.ok) {
        alert('Saved');
        nav('/admin/cms');
      } else {
        if (json.message === 'Forbidden') alert('Forbidden: you do not have permission');
        else alert('Save failed: ' + (json.message || 'unknown'));
      }
    } catch (err: any) {
      alert('Save error: ' + (err?.message || String(err)));
    }
  };

  // ---------------------------------------------------
  // Per-block editor UI (right panel)
  // ---------------------------------------------------
  const BlockEditor: React.FC<{ idx: number }> = ({ idx }) => {
    if (idx === null || idx === undefined) return null;
    const block = page.content_json?.[idx];
    if (!block) return <div className="text-sm text-gray-500">Block missing</div>;

    const set = (newData: any) => updateBlock(idx, { ...block, ...newData });

    if (block.type === 'heading') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Heading text</label>
          <input className="w-full border rounded p-2" value={block.text || ''} onChange={(e) => set({ text: e.target.value })} />
          <label className="block text-sm font-medium">Level</label>
          <select className="w-full border rounded p-2" value={block.level || 2} onChange={(e) => set({ level: Number(e.target.value) })}>
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
        </div>
      );
    }

    if (block.type === 'text') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Paragraph</label>
          <textarea className="w-full border rounded p-2 h-48" value={block.text || ''} onChange={(e) => set({ text: e.target.value })} />
        </div>
      );
    }

    if (block.type === 'html') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium">HTML</label>
          <textarea className="w-full border rounded p-2 h-48 font-mono text-sm" value={block.html || ''} onChange={(e) => set({ html: e.target.value })} />
        </div>
      );
    }

    if (block.type === 'image') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Image source (URL)</label>
          <input className="w-full border rounded p-2" value={block.src || ''} onChange={(e) => set({ src: e.target.value })} />
          <label className="block text-sm font-medium">Alt text</label>
          <input className="w-full border rounded p-2" value={block.alt || ''} onChange={(e) => set({ alt: e.target.value })} />
          <div className="pt-2">
            <label className="block text-sm font-medium mb-1">Or upload file (client preview)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                handleImageFile(f, (dataUrl) => set({ src: dataUrl }));
              }}
            />
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Preview</div>
              {block.src ? <img src={block.src} alt={block.alt || ''} className="max-w-full rounded border mt-2" /> : <div className="text-sm text-gray-500 p-2">No image</div>}
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'divider') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Style</label>
          <select className="w-full border rounded p-2" value={block.style || 'solid'} onChange={(e) => set({ style: e.target.value })}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="none">None</option>
          </select>
          <label className="block text-sm font-medium">Spacing (px)</label>
          <input type="number" className="w-full border rounded p-2" value={block.spacing || 16} onChange={(e) => set({ spacing: Number(e.target.value) })} />
        </div>
      );
    }

    return <div className="text-sm text-gray-500">No editor for this block type</div>;
  };

  // ---------------------------------------------------
  // Render block preview (left list)
  // ---------------------------------------------------
  const renderBlockPreview = (block: any, idx: number) => {
    switch (block.type) {
      case 'heading':
        if (block.level === 1) return <h1 className="text-3xl font-bold">{block.text}</h1>;
        if (block.level === 2) return <h2 className="text-2xl font-semibold">{block.text}</h2>;
        if (block.level === 3) return <h3 className="text-xl font-semibold">{block.text}</h3>;
        return <h4 className="text-lg font-medium">{block.text}</h4>;

      case 'text':
        return <p className="text-base leading-relaxed">{block.text}</p>;

      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: block.html || '' }} />;

      case 'image':
        return block.src ? <img src={block.src} alt={block.alt || ''} className="max-w-full rounded" /> : <div className="text-sm text-gray-500">No image</div>;

      case 'divider':
        return <div style={{ borderTop: block.style === 'dashed' ? '2px dashed #d1d5db' : block.style === 'none' ? 'none' : '2px solid #e5e7eb', margin: block.spacing || 16 }} />;

      default:
        return <pre className="text-xs font-mono">{JSON.stringify(block)}</pre>;
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: top controls + block canvas */}
      <div className="col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center">
            <input placeholder="Slug" value={page.slug || ''} onChange={(e) => setPage({ ...page, slug: e.target.value })} className="border p-2 rounded min-w-[140px]" />
            <input placeholder="Title" value={page.title || ''} onChange={(e) => setPage({ ...page, title: e.target.value })} className="border p-2 rounded min-w-[260px]" />
            <div className="ml-2 text-sm text-gray-500">Mode:</div>
            <div className="inline-flex rounded bg-gray-100 p-1">
              <button className={`px-3 py-1 rounded ${previewMode === 'edit' ? 'bg-white shadow' : ''}`} onClick={() => setPreviewMode('edit')}>Edit</button>
              <button className={`px-3 py-1 rounded ${previewMode === 'preview' ? 'bg-white shadow' : ''}`} onClick={() => setPreviewMode('preview')}>Preview</button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => save(false)}>Save Draft</Button>
            <Button onClick={() => save(true)}>Publish</Button>
          </div>
        </div>

        <div className="mb-4">
          <textarea placeholder="Summary" value={page.summary || ''} onChange={(e) => setPage({ ...page, summary: e.target.value })} className="w-full border p-2 h-20 rounded" />
        </div>

        {/* BLOCK CANVAS */}
        <div className="space-y-3">
          {(page.content_json || []).length === 0 && (
            <div className="p-6 border rounded text-sm text-gray-500">No blocks yet. Use the panel to the right to add blocks.</div>
          )}

          {(page.content_json || []).map((block: any, idx: number) => (
            <div key={idx} className={`p-4 border rounded flex flex-col md:flex-row gap-4 ${selectedIndex === idx ? 'ring-2 ring-blue-200 bg-blue-50' : 'bg-white'}`}>
              <div className="flex-1" onClick={() => setSelectedIndex(idx)} style={{ cursor: 'pointer' }}>
                <div className="flex items-start justify-between">
                  <div className="text-sm font-medium text-gray-700">{block.type}</div>

                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={(e) => { e.stopPropagation(); duplicateBlock(idx); }} className="px-2 py-1 rounded hover:bg-gray-100">Duplicate</button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, idx - 1); }} disabled={idx === 0} className="px-2 py-1 rounded hover:bg-gray-100">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, idx + 1); }} disabled={idx === (page.content_json || []).length - 1} className="px-2 py-1 rounded hover:bg-gray-100">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(idx); }} className="px-2 py-1 rounded text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>

                <div className="mt-3">
                  {previewMode === 'preview' ? (
                    <div className="prose">{renderBlockPreview(block, idx)}</div>
                  ) : (
                    <div className="text-sm text-gray-800">{renderBlockPreview(block, idx)}</div>
                  )}
                </div>
              </div>

              {/* quick toolbar for small controls */}
              <div className="w-full md:w-48 flex flex-col gap-2">
                <div className="text-xs text-gray-400">Quick actions</div>
                <button onClick={() => setSelectedIndex(idx)} className="w-full px-2 py-1 border rounded text-sm">Edit</button>
                <button onClick={() => duplicateBlock(idx)} className="w-full px-2 py-1 border rounded text-sm">Duplicate</button>
                <div className="flex gap-2">
                  <button onClick={() => moveBlock(idx, idx - 1)} disabled={idx === 0} className="flex-1 px-2 py-1 border rounded text-sm">Up</button>
                  <button onClick={() => moveBlock(idx, idx + 1)} disabled={idx === (page.content_json || []).length - 1} className="flex-1 px-2 py-1 border rounded text-sm">Down</button>
                </div>
                <button onClick={() => removeBlock(idx)} className="w-full px-2 py-1 border rounded text-sm text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: block library + editor */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Add Block</h3>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {DEFAULT_BLOCK_TYPES.map((bt) => (
              <button key={bt.key} onClick={() => addBlock(bt.sample)} className="w-full text-left border rounded p-2 hover:bg-gray-50">
                <div className="font-medium">{bt.title}</div>
                <div className="text-xs text-gray-500">{bt.key}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Edit Block</h3>
          <div className="mt-3 p-3 border rounded min-h-[220px]">
            {selectedIndex === null || selectedIndex === undefined ? (
              <div className="text-sm text-gray-500">Select a block to edit its settings</div>
            ) : (
              <BlockEditor idx={selectedIndex} />
            )}
          </div>
        </div>

        {/* quick preview of full page */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Page Preview</h3>
          <div className="mt-2 p-3 border rounded bg-white">
            <div className="text-sm text-gray-600 mb-2">{page.title || 'Untitled'}</div>
            <div className="space-y-3">
              {(page.content_json || []).map((b: any, i: number) => (
                <div key={i} className="p-2 border-b last:border-b-0">
                  {renderBlockPreview(b, i)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
