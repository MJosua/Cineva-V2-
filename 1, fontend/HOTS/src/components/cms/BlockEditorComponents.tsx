import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, Copy, Image as ImageIcon,
  Type, AlignLeft, Minus, LayoutGrid, Settings,
  FileText, Link2, Library, Bold, Italic, List, PlusCircle
} from 'lucide-react';

export const BLOCK_CATALOG = [
  { key: 'heading', label: 'Heading', icon: Type, desc: 'Section title', sample: { type: 'heading', text: 'New Heading', level: 2 } },
  { key: 'richtext', label: 'Rich Text', icon: AlignLeft, desc: 'Paragraph with formatting', sample: { type: 'richtext', content: 'Start writing here...' } },
  { key: 'text', label: 'Plain Text', icon: FileText, desc: 'Simple text block', sample: { type: 'text', content: 'Plain text content' } },
  { key: 'image', label: 'Image', icon: ImageIcon, desc: 'Standalone image/banner', sample: { type: 'image', src: '', alt: '', caption: '' } },
  { key: 'divider', label: 'Divider', icon: Minus, desc: 'Visual separator', sample: { type: 'divider', style: 'solid' } },
  { key: 'card-grid', label: 'Card Grid', icon: LayoutGrid, desc: 'Feature cards', sample: { type: 'card-grid', items: [{ title: 'Card 1', desc: 'Description' }] } },
];

export function SortableBlockCard({
  block, index, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onInsertAfter
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
          <div className="px-4 py-3 min-h-[48px]">
            <BlockContentPreview block={block} onUpdate={(data: any) => onUpdate(index, data)} isSelected={isSelected} />
          </div>
        </CardContent>
      </Card>
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

export function BlockContentPreview({ block, onUpdate, isSelected }: any) {
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

export function BlockInspector({ block, onUpdate }: { block: any; onUpdate: (data: any) => void }) {
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
