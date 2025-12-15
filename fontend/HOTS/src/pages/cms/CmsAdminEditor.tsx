import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetPage, adminSavePage } from '@/api/cms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_URL } from '@/config/sourceConfig';
import { widgetRegistry } from '@/registry/widgetRegistry';
import {
  ArrowUp, ArrowDown, Copy, Trash2, Edit3, Eye, Save, Send,
  Type, AlignLeft, Code, Image, Minus, Puzzle, Plus, FileText,
  GripVertical, Sparkles, ArrowLeft, Check, X, Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const DEFAULT_BLOCK_TYPES = [
  { key: 'heading', title: 'Heading', icon: Type, color: 'bg-blue-500', sample: { type: 'heading', text: 'Heading text', level: 2 } },
  { key: 'text', title: 'Paragraph', icon: AlignLeft, color: 'bg-green-500', sample: { type: 'text', text: 'Some paragraph text' } },
  { key: 'html', title: 'HTML Code', icon: Code, color: 'bg-purple-500', sample: { type: 'html', html: '<p>HTML content</p>' } },
  { key: 'image', title: 'Image', icon: Image, color: 'bg-orange-500', sample: { type: 'image', src: 'https://via.placeholder.com/600x300', alt: 'Image alt' } },
  { key: 'divider', title: 'Divider', icon: Minus, color: 'bg-gray-500', sample: { type: 'divider', style: 'solid' } },
  { key: 'widget', title: 'Widget', icon: Puzzle, color: 'bg-pink-500', sample: { type: 'widget', widgetId: '', params: {} } },
];

const clone = (v: any) => JSON.parse(JSON.stringify(v));

export default function CmsAdminEditor() {
  const { id } = useParams<{ id?: string }>();
  const nav = useNavigate();

  const [page, setPage] = useState<any>({ slug: '', title: '', summary: '', content_json: [] });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    async function load() {
      if (!id || id === 'new') return;
      setLoading(true);
      try {
        const json = await adminGetPage(Number(id));
        if (json.ok) {
          const p = clone(json.page);
          if (typeof p.content_json === 'string') {
            try { p.content_json = JSON.parse(p.content_json); } catch { p.content_json = []; }
          }
          setPage(p);
        } else {
          alert('Failed to load page: ' + (json.message || 'unknown'));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [page.page_id]);

  const addBlock = (sample: any) => {
    setPage((p: any) => ({ ...p, content_json: [...(p.content_json || []), clone(sample)] }));
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

  const handleImageFile = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => onDone(String(reader.result));
    reader.onerror = () => alert('Image read failed');
    reader.readAsDataURL(file);
  };

  const save = async (publish = false) => {
    if (!page.slug || page.slug.trim() === '') {
      alert('Slug cannot be empty');
      return;
    }
    setSaving(true);
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
        alert(publish ? 'Published successfully!' : 'Saved as draft');
        nav('/admin/cms');
      } else {
        if (json.message === 'Forbidden') alert('Forbidden: you do not have permission');
        else alert('Save failed: ' + (json.message || 'unknown'));
      }
    } catch (err: any) {
      alert('Save error: ' + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const BlockEditor: React.FC<{ idx: number }> = ({ idx }) => {
    if (idx === null || idx === undefined) return null;
    const block = page.content_json?.[idx];
    if (!block) return <div className="text-sm text-gray-500 p-4">Block missing</div>;

    const set = (newData: any) => updateBlock(idx, { ...block, ...newData });

    const blockType = DEFAULT_BLOCK_TYPES.find(bt => bt.key === block.type);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <div className={`w-8 h-8 rounded-lg ${blockType?.color || 'bg-gray-500'} flex items-center justify-center`}>
            {blockType?.icon && <blockType.icon className="w-4 h-4 text-white" />}
          </div>
          <span className="font-medium capitalize">{block.type} Block</span>
        </div>

        {block.type === 'heading' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-600">Heading Text</Label>
              <Input
                className="mt-1"
                value={block.text || ''}
                onChange={(e) => set({ text: e.target.value })}
                placeholder="Enter heading..."
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Size</Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4].map(level => (
                  <Button
                    key={level}
                    variant={block.level === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set({ level })}
                    className="flex-1"
                  >
                    H{level}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {block.type === 'text' && (
          <div>
            <Label className="text-xs font-medium text-gray-600">Paragraph Content</Label>
            <Textarea
              className="mt-1 min-h-[200px]"
              value={block.text || ''}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="Enter your content here..."
            />
          </div>
        )}

        {block.type === 'html' && (
          <div>
            <Label className="text-xs font-medium text-gray-600">HTML Code</Label>
            <Textarea
              className="mt-1 min-h-[200px] font-mono text-sm bg-gray-900 text-green-400"
              value={block.html || ''}
              onChange={(e) => set({ html: e.target.value })}
              placeholder="<div>Your HTML here...</div>"
            />
          </div>
        )}

        {block.type === 'image' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-600">Image URL</Label>
              <Input
                className="mt-1"
                value={block.src || ''}
                onChange={(e) => set({ src: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Alt Text</Label>
              <Input
                className="mt-1"
                value={block.alt || ''}
                onChange={(e) => set({ alt: e.target.value })}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Or Upload File</Label>
              <Input
                type="file"
                accept="image/*"
                className="mt-1"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  handleImageFile(f, (dataUrl) => set({ src: dataUrl }));
                }}
              />
            </div>
            {block.src && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs font-medium text-gray-600">Preview</Label>
                <img src={block.src} alt={block.alt || ''} className="mt-2 max-w-full rounded-lg shadow-sm" />
              </div>
            )}
          </>
        )}

        {block.type === 'divider' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-600">Style</Label>
              <div className="flex gap-2 mt-1">
                {['solid', 'dashed', 'none'].map(style => (
                  <Button
                    key={style}
                    variant={block.style === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set({ style })}
                    className="flex-1 capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Spacing (px)</Label>
              <Input
                type="number"
                className="mt-1"
                value={block.spacing || 16}
                onChange={(e) => set({ spacing: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        {block.type === 'widget' && (
          <WidgetEditor block={block} set={set} />
        )}
      </div>
    );
  };

  const WidgetEditor: React.FC<{ block: any; set: (data: any) => void }> = ({ block, set }) => {
    const [jsonText, setJsonText] = useState(JSON.stringify(block.params || {}, null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);

    const handleJsonChange = (value: string) => {
      setJsonText(value);
      try {
        const parsed = JSON.parse(value);
        set({ params: parsed });
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON');
      }
    };

    const selectedWidget = widgetRegistry[block.widgetId];

    return (
      <>
        <div>
          <Label className="text-xs font-medium text-gray-600">Select Widget</Label>
          <select
            className="w-full mt-1 border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={block.widgetId || ''}
            onChange={(e) => set({ widgetId: e.target.value })}
          >
            <option value="">-- Choose Widget --</option>
            {Object.entries(
              Object.values(widgetRegistry).reduce((acc: any, w: any) => {
                const cat = w.category || 'Other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(w);
                return acc;
              }, {})
            ).map(([category, widgets]: [string, any]) => (
              <optgroup key={category} label={category}>
                {widgets.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedWidget && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Puzzle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">{selectedWidget.name}</span>
              <Badge variant="outline" className="text-xs">{selectedWidget.category}</Badge>
            </div>
            <p className="text-sm text-blue-700">{selectedWidget.description}</p>
          </div>
        )}

        <div>
          <Label className="text-xs font-medium text-gray-600">Parameters (JSON)</Label>
          <Textarea
            className={`mt-1 font-mono text-sm min-h-[100px] ${jsonError ? 'border-red-500 bg-red-50' : 'bg-gray-50'}`}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{ "limit": 5 }'
          />
          {jsonError ? (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <X className="w-3 h-3" /> {jsonError}
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <Check className="w-3 h-3" /> Valid JSON
            </div>
          )}
        </div>
      </>
    );
  };

  const renderBlockPreview = (block: any) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        const sizes: any = { 1: 'text-3xl font-bold', 2: 'text-2xl font-semibold', 3: 'text-xl font-semibold', 4: 'text-lg font-medium' };
        return <HeadingTag className={sizes[block.level || 2]}>{block.text || 'Heading'}</HeadingTag>;

      case 'text':
        return <p className="text-base leading-relaxed text-gray-700">{block.text || 'Paragraph text...'}</p>;

      case 'html':
        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.html || '<p>HTML content</p>' }} />;

      case 'image':
        return block.src ? (
          <img src={block.src} alt={block.alt || ''} className="max-w-full rounded-lg shadow-sm" />
        ) : (
          <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Image className="w-8 h-8" />
          </div>
        );

      case 'divider':
        return (
          <div
            style={{
              borderTop: block.style === 'dashed' ? '2px dashed #d1d5db' : block.style === 'none' ? 'none' : '2px solid #e5e7eb',
              margin: `${block.spacing || 16}px 0`
            }}
          />
        );

      case 'widget':
        const w = widgetRegistry[block.widgetId];
        return (
          <div className="p-4 border-2 border-dashed border-purple-300 bg-purple-50/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Puzzle className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">{w?.name || 'Select Widget'}</span>
            </div>
            {w?.description && <p className="text-sm text-purple-600">{w.description}</p>}
          </div>
        );

      default:
        return <pre className="text-xs font-mono bg-gray-100 p-2 rounded">{JSON.stringify(block)}</pre>;
    }
  };

  const getBlockIcon = (type: string) => {
    const bt = DEFAULT_BLOCK_TYPES.find(b => b.key === type);
    return bt?.icon || FileText;
  };

  const getBlockColor = (type: string) => {
    const bt = DEFAULT_BLOCK_TYPES.find(b => b.key === type);
    return bt?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => nav('/admin/cms')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id === 'new' ? 'Create New Page' : 'Edit Page'}
              </h1>
              <p className="text-gray-500 text-sm">Build your page with blocks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={previewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('edit')}
              >
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                variant={previewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('preview')}
              >
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
            </div>

            <Button variant="outline" onClick={() => save(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Draft
            </Button>
            <Button onClick={() => save(true)} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Page Meta */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Page Slug (URL)</Label>
                    <Input
                      className="mt-1"
                      placeholder="my-page-url"
                      value={page.slug || ''}
                      onChange={(e) => setPage({ ...page, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Page Title</Label>
                    <Input
                      className="mt-1"
                      placeholder="My Awesome Page"
                      value={page.title || ''}
                      onChange={(e) => setPage({ ...page, title: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs font-medium text-gray-600">Summary</Label>
                  <Textarea
                    className="mt-1 min-h-[60px]"
                    placeholder="A brief description of this page..."
                    value={page.summary || ''}
                    onChange={(e) => setPage({ ...page, summary: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Blocks Canvas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Content Blocks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(page.content_json || []).length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No blocks yet</p>
                    <p className="text-sm text-gray-400">Add blocks from the panel on the right →</p>
                  </div>
                ) : (
                  (page.content_json || []).map((block: any, idx: number) => {
                    const IconComponent = getBlockIcon(block.type);
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`
                          group relative p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}
                      >
                        {/* Block Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${getBlockColor(block.type)} flex items-center justify-center`}>
                              <IconComponent className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 capitalize">{block.type}</span>
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveBlock(idx, idx - 1); }} disabled={idx === 0}>
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveBlock(idx, idx + 1); }} disabled={idx === (page.content_json || []).length - 1}>
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); duplicateBlock(idx); }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeBlock(idx); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Block Preview */}
                        <div className="pl-8">
                          {renderBlockPreview(block)}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Add Block Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  Add Block
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.key}
                      onClick={() => addBlock(bt.sample)}
                      className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${bt.color} flex items-center justify-center flex-shrink-0`}>
                        <bt.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{bt.title}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Block Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-500" />
                  Edit Block
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIndex === null || selectedIndex === undefined ? (
                  <div className="p-6 text-center text-gray-400">
                    <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click a block to edit</p>
                  </div>
                ) : (
                  <BlockEditor idx={selectedIndex} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
