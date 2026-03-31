import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetPage, adminSavePage, fetchCategories, createCategory } from '@/api/cms';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, Copy, ChevronUp, ChevronDown, Image as ImageIcon,
  Type, AlignLeft, Minus, LayoutGrid, Save, Eye, ArrowLeft, Settings,
  FileText, Tag, Globe, PlusCircle, X, Upload, Bold, Italic, List, Link2, Library, Bell
} from 'lucide-react';
import MediaLibraryModal from '@/components/modals/MediaLibraryModal';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const clone = (v: any) => JSON.parse(JSON.stringify(v));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const BLOCK_CATALOG = [
  { key: 'heading', label: 'Heading', icon: Type, desc: 'Section title', sample: { type: 'heading', text: 'New Heading', level: 2 } },
  { key: 'richtext', label: 'Rich Text', icon: AlignLeft, desc: 'Paragraph with formatting', sample: { type: 'richtext', content: 'Start writing here...' } },
  { key: 'text', label: 'Plain Text', icon: FileText, desc: 'Simple text block', sample: { type: 'text', content: 'Plain text content' } },
  { key: 'image', label: 'Image', icon: ImageIcon, desc: 'Standalone image/banner', sample: { type: 'image', src: '', alt: '', caption: '' } },
  { key: 'divider', label: 'Divider', icon: Minus, desc: 'Visual separator', sample: { type: 'divider', style: 'solid' } },
  { key: 'card-grid', label: 'Card Grid', icon: LayoutGrid, desc: 'Feature cards', sample: { type: 'card-grid', items: [{ title: 'Card 1', desc: 'Description' }] } },
];

// ─────────────────────────────────────────────
// Sortable Block Card
// ─────────────────────────────────────────────
function SortableBlockCard({
  block, index, totalBlocks, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onInsertAfter
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const blockMeta = BLOCK_CATALOG.find(b => b.key === block.type) || BLOCK_CATALOG[2];
  const IconComp = blockMeta.icon;

  return (
    <div ref={setNodeRef} style={style as any}>
      <Card
        className={`group relative transition-all duration-150 cursor-pointer border ${
          isSelected
            ? 'ring-2 ring-blue-400 border-blue-200 shadow-md bg-blue-50/30'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
        }`}
        onClick={() => onSelect(index)}
      >
        <CardContent className="p-0">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-lg">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <IconComp className="w-3.5 h-3.5" />
              {blockMeta.label}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); onDuplicate(index); }}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Duplicate">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(index); }}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Preview */}
          <div className="px-4 py-3 min-h-[48px]">
            <BlockContentPreview block={block} onUpdate={(data: any) => onUpdate(index, data)} isSelected={isSelected} />
          </div>
        </CardContent>
      </Card>

      {/* Insert button between cards */}
      <div className="flex justify-center py-1.5 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onInsertAfter(index); }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 bg-white border border-dashed border-slate-200 hover:border-blue-400 rounded-full px-3 py-1 transition-all hover:shadow-sm"
        >
          <Plus className="w-3 h-3" /> Add Block
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Block Content Preview (inline editing)
// ─────────────────────────────────────────────
function BlockContentPreview({ block, onUpdate, isSelected }: any) {
  if (block.type === 'heading') {
    const Tag = `h${block.level || 2}` as any;
    const sizes: any = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg' };
    return (
      <Tag
        contentEditable={isSelected}
        suppressContentEditableWarning
        className={`${sizes[block.level || 2]} font-bold text-slate-900 outline-none ${isSelected ? 'ring-1 ring-blue-200 rounded px-1' : ''}`}
        onBlur={(e: any) => onUpdate({ text: e.currentTarget.textContent })}
      >
        {block.text || 'Untitled'}
      </Tag>
    );
  }

  if (block.type === 'richtext' || block.type === 'text') {
    const text = block.content || block.text || '';
    return (
      <div
        contentEditable={isSelected}
        suppressContentEditableWarning
        className={`text-slate-600 leading-relaxed whitespace-pre-wrap outline-none min-h-[32px] ${isSelected ? 'ring-1 ring-blue-200 rounded px-1' : ''}`}
        onBlur={(e: any) => onUpdate({ content: e.currentTarget.textContent, text: e.currentTarget.textContent })}
        dangerouslySetInnerHTML={{ 
          __html: text
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3 border shadow-sm mx-auto block" />')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-pink-600 font-mono text-xs">$1</code>')
            .replace(/\n/g, '<br/>') 
        }}
      />
    );
  }

  if (block.type === 'image') {
    if (block.src) {
      return (
        <div className="relative group/img">
          <img src={block.src} alt={block.alt || ''} className="rounded-lg border max-h-[200px] object-contain mx-auto shadow-sm" />
          {block.caption && <div className="text-center text-xs text-slate-400 mt-1 italic">{block.caption}</div>}
        </div>
      );
    }
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 hover:border-blue-300 transition-colors">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <div className="text-sm">Click to add an image</div>
      </div>
    );
  }

  if (block.type === 'divider') {
    return <hr className={`my-2 border-slate-200 ${block.style === 'dashed' ? 'border-dashed' : ''}`} />;
  }

  if (block.type === 'card-grid') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
            <div className="font-medium text-slate-700">{item.title}</div>
            <div className="text-slate-400 text-xs mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs font-mono text-slate-400">{JSON.stringify(block, null, 2)}</pre>;
}

// ─────────────────────────────────────────────
// Block Inspector (right sidebar)
// ─────────────────────────────────────────────
function BlockInspector({ block, onUpdate }: { block: any; onUpdate: (data: any) => void }) {
  if (!block) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 px-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
        <Settings className="w-8 h-8 text-slate-200" />
      </div>
      <div className="text-sm font-semibold text-slate-600">Block Inspector</div>
      <p className="text-xs mt-2 leading-relaxed">Select a content block on the left to customize its properties and settings.</p>
      <div className="mt-8 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50 text-[10px] text-blue-500 font-medium flex items-center gap-2">
        <Library className="w-3 h-3" />
        HOTS CMS MEDIA LIBRARY ENABLED
      </div>
    </div>
  );

  const set = (data: any) => onUpdate({ ...block, ...data });

  if (block.type === 'heading') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Heading Text</label>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" value={block.text || ''} onChange={e => set({ text: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Level</label>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map(l => (
              <button key={l} onClick={() => set({ level: l })}
                className={`py-1.5 rounded-md text-sm font-medium transition-all ${block.level === l ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                H{l}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'richtext' || block.type === 'text') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Content</label>
          {/* Mini toolbar */}
          <div className="flex gap-1 mb-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
            <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700" title="List"><List className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
            <div className="w-px bg-slate-200 mx-1" />
            <button 
              className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700" 
              title="Insert Image"
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MEDIA_LIBRARY', { 
                detail: { 
                  onSelect: (url: string) => {
                    const img = `\n![image](${url})\n`;
                    set({ content: (block.content || '') + img, text: (block.text || '') + img });
                  } 
                } 
              }))}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-52 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-y font-mono leading-relaxed"
            value={block.content || block.text || ''}
            onChange={e => set({ content: e.target.value, text: e.target.value })}
            placeholder="Write your content here... Use **bold** for emphasis."
          />
        </div>
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Media Library</label>
          <Button 
            variant="outline" 
            className="w-full gap-2 border-dashed border-2 hover:bg-blue-50/30 hover:border-blue-400 py-6"
            onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MEDIA_LIBRARY', { detail: { onSelect: (url: string) => set({ src: url }) } }))}
          >
            <Library className="w-5 h-5 text-slate-400" />
            <span className="text-slate-500">Choose from Library</span>
          </Button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Direct Upload (URL)</label>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={block.src || ''} onChange={e => set({ src: e.target.value })} placeholder="https://..." />
        </div>
        {block.src && (
          <div>
            <img src={block.src} alt={block.alt || ''} className="rounded-lg border max-h-[150px] object-contain mx-auto" />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Alt Text</label>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={block.alt || ''} onChange={e => set({ alt: e.target.value })} placeholder="Image description" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Caption</label>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={block.caption || ''} onChange={e => set({ caption: e.target.value })} placeholder="Optional caption" />
        </div>
      </div>
    );
  }

  if (block.type === 'divider') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Style</label>
          <div className="grid grid-cols-3 gap-1">
            {['solid', 'dashed', 'none'].map(s => (
              <button key={s} onClick={() => set({ style: s })}
                className={`py-1.5 rounded-md text-sm font-medium capitalize transition-all ${block.style === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'card-grid') {
    return (
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Cards</label>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Card {i + 1}</span>
              <button onClick={() => {
                const items = [...(block.items || [])];
                items.splice(i, 1);
                set({ items });
              }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
            </div>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Title" value={item.title || ''} onChange={e => {
              const items = [...(block.items || [])];
              items[i] = { ...items[i], title: e.target.value };
              set({ items });
            }} />
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Description" value={item.desc || ''} onChange={e => {
              const items = [...(block.items || [])];
              items[i] = { ...items[i], desc: e.target.value };
              set({ items });
            }} />
          </div>
        ))}
        <button onClick={() => set({ items: [...(block.items || []), { title: 'New Card', desc: '' }] })}
          className="w-full border border-dashed border-slate-200 rounded-lg py-2 text-sm text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center justify-center gap-1">
          <PlusCircle className="w-3.5 h-3.5" /> Add Card
        </button>
      </div>
    );
  }

  return <div className="text-sm text-slate-400">No inspector for "{block.type}"</div>;
}

// ─────────────────────────────────────────────
// Main Editor Component
// ─────────────────────────────────────────────
export default function CmsAdminEditor() {
  const { id } = useParams<{ id?: string }>();
  const nav = useNavigate();
  const isNew = !id || id === 'new';

  const [page, setPage] = useState<any>({
    slug: '', title: '', summary: '', thumbnail: '', content_json: [], meta_json: {}, status: 'draft',
    is_pinned: 0, priority: 0
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'inspector'>('settings');
  const [mediaModal, setMediaModal] = useState<{ open: boolean; onSelect: (url: string) => void }>({ open: false, onSelect: () => {} });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Event listener for media library
  useEffect(() => {
    const handleOpen = (e: any) => {
      setMediaModal({ open: true, onSelect: e.detail.onSelect });
    };
    window.addEventListener('OPEN_MEDIA_LIBRARY', handleOpen);
    return () => window.removeEventListener('OPEN_MEDIA_LIBRARY', handleOpen);
  }, []);

  // Load page + categories
  useEffect(() => {
    fetchCategories().then(r => setCategories(r.data || []));
    if (isNew) return;
    setLoading(true);
    adminGetPage(Number(id)).then(json => {
      if (json.ok) {
        const p = clone(json.data || json.page);
        // Parse content_json
        let data = p.content_json;
        let iter = 0;
        while (typeof data === 'string' && iter < 5) {
          try { data = JSON.parse(data); iter++; } catch { break; }
        }
        if (data && !Array.isArray(data) && Array.isArray(data.blocks)) data = data.blocks;
        p.content_json = (Array.isArray(data) ? data : []).map((b: any, i: number) => ({
          ...b,
          _id: b._id || `block-${Date.now()}-${i}`,
        }));
        // Parse meta_json
        if (typeof p.meta_json === 'string') {
          try { p.meta_json = JSON.parse(p.meta_json); } catch { p.meta_json = {}; }
        }
        setPage(p);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  // Auto-slug from title on new posts
  useEffect(() => {
    if (isNew && page.title) {
      setPage((p: any) => ({ ...p, slug: slugify(p.title) }));
    }
  }, [page.title, isNew]);

  const blocks = page.content_json || [];
  const selectedBlock = selectedIdx !== null ? blocks[selectedIdx] : null;

  // Block operations
  const updateBlock = useCallback((idx: number, data: any) => {
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr[idx] = { ...arr[idx], ...data };
      return { ...p, content_json: arr };
    });
  }, []);

  const deleteBlock = useCallback((idx: number) => {
    if (!confirm('Delete this block?')) return;
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr.splice(idx, 1);
      return { ...p, content_json: arr };
    });
    setSelectedIdx(null);
  }, []);

  const duplicateBlock = useCallback((idx: number) => {
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      arr.splice(idx + 1, 0, { ...clone(arr[idx]), _id: `block-${Date.now()}` });
      return { ...p, content_json: arr };
    });
    setSelectedIdx(idx + 1);
  }, []);

  const insertBlock = (sample: any, atIdx?: number) => {
    const newBlock = { ...clone(sample), _id: `block-${Date.now()}` };
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      const pos = atIdx !== undefined && atIdx !== null ? atIdx + 1 : arr.length;
      arr.splice(pos, 0, newBlock);
      return { ...p, content_json: arr };
    });
    setShowBlockPicker(false);
    setInsertAtIndex(null);
  };

  // Drag & Drop
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPage((p: any) => {
      const arr = [...(p.content_json || [])];
      const oldIdx = arr.findIndex((b: any) => b._id === active.id);
      const newIdx = arr.findIndex((b: any) => b._id === over.id);
      if (oldIdx === -1 || newIdx === -1) return p;
      return { ...p, content_json: arrayMove(arr, oldIdx, newIdx) };
    });
  };

  // Save
  const save = async (publish = false) => {
    if (!page.slug?.trim()) { alert('Slug is required'); return; }
    if (!page.title?.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
        const payload = {
          page_id: page.page_id || null,
          module_key: page.module_key || 'helpcenter',
          slug: page.slug,
          title: page.title,
          summary: page.summary,
          thumbnail: page.thumbnail,
          content_json: blocks.map(({ _id, ...rest }: any) => rest),
          meta_json: page.meta_json || {},
          status: publish ? 'published' : (page.status || 'draft'),
          is_pinned: page.is_pinned || 0,
          priority: page.priority || 0,
        };
      const res = await adminSavePage(payload);
      if (res.ok) {
        nav('/admin/cms');
      } else {
        alert('Save failed: ' + (res.message || 'unknown'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Create category inline
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await createCategory({ category_name: newCatName.trim() });
    if (res.ok) {
      setCategories([...categories, res.data]);
      setPage((p: any) => ({ ...p, meta_json: { ...p.meta_json, category_id: String(res.data.category_id) } }));
      setNewCatName('');
      setShowNewCatModal(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Loading editor...</div>;

  return (
    <div className="flex flex-col bg-white h-[calc(100vh-170px)] border rounded-xl overflow-hidden shadow-xl">
      {/* ─── Top Bar ─── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/admin/cms')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => nav('/admin/cms')}>CMS Manager</span>
              <span>/</span>
              <span className="text-slate-600">{isNew ? 'New Post' : 'Edit Post'}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 -mt-0.5">{page.title || 'Untitled Post'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page.slug && (
            <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5"
              onClick={() => window.open(`/hots/page/${page.slug}`, '_blank')}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-md">
            <Globe className="w-4 h-4" /> Publish
          </Button>
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Content Canvas ─── */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Post Header Card */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                  <input
                    className="w-full text-2xl font-bold text-slate-900 border-0 border-b-2 border-transparent focus:border-blue-400 outline-none pb-1 bg-transparent placeholder:text-slate-300"
                    value={page.title || ''}
                    onChange={e => setPage({ ...page, title: e.target.value })}
                    placeholder="Enter post title..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Slug</label>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <span>/page/</span>
                      <input className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={page.slug || ''} onChange={e => setPage({ ...page, slug: e.target.value })} />
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Thumbnail</label>
                    <div
                      className="block w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => setMediaModal({ open: true, onSelect: (url) => setPage({ ...page, thumbnail: url }) })}
                    >
                      {page.thumbnail ? (
                        <img src={page.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><ImageIcon className="w-5 h-5 text-slate-300" /></div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Summary</label>
                  <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-16 focus:ring-2 focus:ring-blue-100 outline-none resize-none" value={page.summary || ''} onChange={e => setPage({ ...page, summary: e.target.value })} placeholder="Brief description..." />
                </div>
              </CardContent>
            </Card>

            {/* Block Canvas */}
            {blocks.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <div className="text-slate-400 font-medium">No content blocks yet</div>
                <button onClick={() => { setInsertAtIndex(null); setShowBlockPicker(true); }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">
                  <Plus className="w-4 h-4" /> Add First Block
                </button>
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b: any) => b._id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block: any, idx: number) => (
                  <SortableBlockCard
                    key={block._id}
                    block={block}
                    index={idx}
                    totalBlocks={blocks.length}
                    isSelected={selectedIdx === idx}
                    onSelect={(i: number) => { setSelectedIdx(i); setSidebarTab('inspector'); }}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onDuplicate={duplicateBlock}
                    onInsertAfter={(i: number) => { setInsertAtIndex(i); setShowBlockPicker(true); }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {blocks.length > 0 && (
              <div className="flex justify-center pb-6">
                <button onClick={() => { setInsertAtIndex(null); setShowBlockPicker(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add Block
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-200">
            {(['settings', 'inspector'] as const).map(t => (
              <button key={t} onClick={() => setSidebarTab(t)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  sidebarTab === t ? 'text-blue-600 border-blue-600 bg-blue-50/30' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}>
                {t === 'settings' ? 'Post Settings' : 'Block Inspector'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {sidebarTab === 'settings' ? (
              <>
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Tag className="inline w-3 h-3 mr-1" /> Category
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    value={page.meta_json?.category_id || ''}
                    onChange={e => setPage((p: any) => ({ ...p, meta_json: { ...p.meta_json, category_id: e.target.value } }))}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c: any) => (
                      <option key={c.category_id} value={c.category_id}>{c.icon} {c.category_name}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowNewCatModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                    <PlusCircle className="w-3 h-3" /> Create New Category
                  </button>
                </div>

                {/* Module Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Module Key</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    value={page.module_key || ''}
                    onChange={e => setPage((p: any) => ({ ...p, module_key: e.target.value }))}>
                    <option value="">None</option>
                    <option value="update">FAQ & Update</option>
                    <option value="guide">User Guide</option>
                    <option value="admin_guide">Admin Guide</option>
                    <option value="blog">Blog</option>
                    <option value="notice">Notices</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>

                {/* Status & Priority */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${page.is_pinned ? 'text-blue-600' : 'text-slate-300'}`} />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Pinned Post</span>
                    </div>
                    <button 
                      onClick={() => setPage((p: any) => ({ ...p, is_pinned: p.is_pinned ? 0 : 1 }))}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-found disabled:opacity-50 ${page.is_pinned ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${page.is_pinned ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority Order</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        value={page.priority || 0}
                        onChange={e => setPage((p: any) => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 w-24 leading-tight">Higher numbers show first</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                    <div className="inline-flex w-full rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      {['draft', 'published'].map(s => (
                        <button key={s} onClick={() => setPage((p: any) => ({ ...p, status: s }))}
                          className={`flex-1 px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                            page.status === s
                              ? s === 'published' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <BlockInspector
                block={selectedBlock}
                onUpdate={(data) => selectedIdx !== null && updateBlock(selectedIdx, data)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Block Picker Modal ─── */}
      {showBlockPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowBlockPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Content Block</h3>
                <p className="text-sm text-slate-400 mt-0.5">Choose a block type to add</p>
              </div>
              <button onClick={() => setShowBlockPicker(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {BLOCK_CATALOG.map(b => (
                <button key={b.key} onClick={() => insertBlock(b.sample, insertAtIndex ?? undefined)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md transition-all text-left group">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                    <b.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-700">{b.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{b.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── New Category Modal ─── */}
      {showNewCatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowNewCatModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Category</h3>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none mb-4" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name..." autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewCatModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateCategory} className="bg-blue-600 text-white">Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal Integration */}
      <MediaLibraryModal 
        isOpen={mediaModal.open}
        onClose={() => setMediaModal({ ...mediaModal, open: false })}
        onSelect={(url) => {
          mediaModal.onSelect(url);
          setMediaModal({ ...mediaModal, open: false });
        }}
      />
    </div>
  );
}
