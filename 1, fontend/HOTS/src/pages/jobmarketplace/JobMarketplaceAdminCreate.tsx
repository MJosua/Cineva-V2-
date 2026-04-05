import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { jobMarketplaceService } from '@/services/jobMarketplaceService';
import { adminSavePage } from '@/api/cms';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BLOCK_CATALOG, SortableBlockCard, BlockInspector } from '@/components/cms/BlockEditorComponents';
import { Plus, X, ArrowLeft, Globe, Settings, LayoutTemplate, BriefcaseBusiness, Tag, Trash2, CheckSquare, ChevronDown } from 'lucide-react';

const clone = (v: any) => JSON.parse(JSON.stringify(v));

export default function JobMarketplaceAdminCreate() {
  const nav = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode') || 'pro'; // 'quick' | 'pro'

  // Basic & Extended Meta State
  const [jobMeta, setJobMeta] = useState({
    title: '',
    job_code: '',
    brand_name: '',
    quota: 1,
    budget_min: 0,
    budget_max: 0,
    start_date: '',
    deadline_at: '',
    platform_id: '1' // legacy single platform fallback (if needed)
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);

  // Category Picker State — API-driven
  const [categoryOptions, setCategoryOptions] = useState<{ category_id: number; category_name: string; description?: string }[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  // Platform Picker State — API-driven
  const [platformOptions, setPlatformOptions] = useState<{ platform_id: number; platform_name: string }[]>([]);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [platformSearch, setPlatformSearch] = useState('');
  const [platformSaving, setPlatformSaving] = useState(false);

  // Content Type Picker State — API-driven
  const [contentTypeOptions, setContentTypeOptions] = useState<{ type_id: number; type_name: string }[]>([]);
  const [contentTypeLoading, setContentTypeLoading] = useState(true);
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [newContentTypeInput, setNewContentTypeInput] = useState('');
  const [contentTypeSearch, setContentTypeSearch] = useState('');
  const [contentTypeSaving, setContentTypeSaving] = useState(false);

  // Checklist Tasks
  const [tasks, setTasks] = useState<{ title: string; platform: string; id: string }[]>([]);

  // CMS Content State (Pro Mode)
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  
  // Custom Brand Picker State — API-driven (persistent)
  const [brandOptions, setBrandOptions] = useState<{ brand_id: number; brand_name: string; industry?: string }[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [brandSaving, setBrandSaving] = useState(false);
  
  // Quick Mode Content State
  const [quickContent, setQuickContent] = useState('');

  const [saving, setSaving] = useState(false);

  // Load brands from API on mount
  useEffect(() => {
    jobMarketplaceService.getBrands()
      .then(res => res.data && setBrandOptions(res.data))
      .catch(() => {
        setBrandOptions([
          { brand_id: 0, brand_name: 'GlowLab', industry: 'Beauty' },
          { brand_id: 0, brand_name: 'SnackTown', industry: 'Food & Beverage' },
          { brand_id: 0, brand_name: 'FitPro', industry: 'Sports' },
        ]);
      })
      .finally(() => setBrandLoading(false));
  }, []);

  // Load categories from API on mount
  useEffect(() => {
    jobMarketplaceService.getCategories()
      .then(res => res.data && setCategoryOptions(res.data))
      .catch(() => {
        setCategoryOptions([
          { category_id: 0, category_name: 'Beauty Enthusiast' },
          { category_id: 0, category_name: 'Foodies' },
          { category_id: 0, category_name: 'Place to Go' },
          { category_id: 0, category_name: 'Gamers' },
          { category_id: 0, category_name: 'Sport Enthusiast' },
          { category_id: 0, category_name: 'Music Enthusiast' },
        ]);
      })
      .finally(() => setCategoryLoading(false));
  }, []);

  // Load platforms from API on mount
  useEffect(() => {
    jobMarketplaceService.getPlatforms()
      .then(res => res.data && setPlatformOptions(res.data))
      .catch(() => {
        setPlatformOptions([
          { platform_id: 1, platform_name: 'Instagram' },
          { platform_id: 2, platform_name: 'TikTok' },
          { platform_id: 3, platform_name: 'YouTube' },
        ]);
      })
      .finally(() => setPlatformLoading(false));
  }, []);

  // Load content types from API on mount
  useEffect(() => {
    jobMarketplaceService.getContentTypes()
      .then(res => res.data && setContentTypeOptions(res.data))
      .catch(() => {
        setContentTypeOptions([
          { type_id: 1, type_name: 'Photo' },
          { type_id: 2, type_name: 'Video' },
          { type_id: 3, type_name: 'Review' },
        ]);
      })
      .finally(() => setContentTypeLoading(false));
  }, []);

  const handleAddCategory = async () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    const duplicate = categoryOptions.find(c => c.category_name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      toast({ variant: 'destructive', description: `Niche "${duplicate.category_name}" sudah ada dalam list.` });
      return;
    }
    setCategorySaving(true);
    try {
      const res = await jobMarketplaceService.createCategory(name);
      if (res.success) {
        const newCat = res.data;
        setCategoryOptions(prev => [newCat, ...prev]);
        setCategories(prev => [...prev, newCat.category_name]);
        setNewCategoryInput('');
        setShowCategoryDropdown(false);
        toast({ title: 'Niche Added', description: `"${newCat.category_name}" has been saved to the registry.` });
      } else if (res.message?.includes('already exists')) {
        toast({ variant: 'destructive', description: 'Niche already exists in the registry.' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save niche. Please try again.' });
    } finally {
      setCategorySaving(false);
    }
  };

  const handleAddBrand = async () => {
    const name = newBrandInput.trim();
    if (!name) return;
    // Cek duplikat case-insensitive di local state terlebih dahulu
    const duplicate = brandOptions.find(b => b.brand_name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      toast({ variant: 'destructive', description: `Brand "${duplicate.brand_name}" sudah ada dalam list.` });
      return;
    }
    setBrandSaving(true);
    try {
      const res = await jobMarketplaceService.createBrand(name, newBrandIndustry || undefined);
      if (res.success) {
        const newBrand = res.data;
        setBrandOptions(prev => [newBrand, ...prev]);
        setJobMeta({ ...jobMeta, brand_name: newBrand.brand_name });
        setNewBrandInput('');
        setNewBrandIndustry('');
        setShowBrandDropdown(false);
        toast({ title: 'Brand Added', description: `"${newBrand.brand_name}" has been saved to the brand registry.` });
      } else if (res.message?.includes('already exists')) {
        toast({ variant: 'destructive', description: 'Brand already exists in the registry.' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save brand. Please try again.' });
    } finally {
      setBrandSaving(false);
    }
  };

  const handleAddPlatform = async () => {
    const name = newPlatformInput.trim();
    if (!name) return;
    const exists = platformOptions.find(p => p.platform_name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast({ variant: 'destructive', description: `Platform "${exists.platform_name}" sudah ada.` });
      return;
    }
    setPlatformSaving(true);
    try {
      const res = await jobMarketplaceService.createPlatform(name);
      if (res.success) {
        setPlatformOptions(prev => [res.data, ...prev]);
        setPlatforms(prev => [...prev, res.data.platform_name]);
        setNewPlatformInput('');
        setShowPlatformDropdown(false);
        toast({ title: 'Platform Registered', description: `"${res.data.platform_name}" added to registry.` });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save platform.' });
    } finally {
      setPlatformSaving(false);
    }
  };

  const handleAddContentType = async () => {
    const name = newContentTypeInput.trim();
    if (!name) return;
    const exists = contentTypeOptions.find(t => t.type_name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast({ variant: 'destructive', description: `Content type "${exists.type_name}" sudah ada.` });
      return;
    }
    setContentTypeSaving(true);
    try {
      const res = await jobMarketplaceService.createContentType(name);
      if (res.success) {
        setContentTypeOptions(prev => [res.data, ...prev]);
        setContentTypes(prev => [...prev, res.data.type_name]);
        setNewContentTypeInput('');
        setShowContentTypeDropdown(false);
        toast({ title: 'Content Type Registered', description: `"${res.data.type_name}" added to registry.` });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save content type.' });
    } finally {
      setContentTypeSaving(false);
    }
  };

  const selectedBlock = selectedIdx !== null ? blocks[selectedIdx] : null;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // --- CMS Editor Logic ---
  const updateBlock = useCallback((idx: number, data: any) => {
    setBlocks(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], ...data };
      return arr;
    });
  }, []);

  const deleteBlock = useCallback((idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }, []);

  const duplicateBlock = useCallback((idx: number) => {
    setBlocks(prev => {
      const arr = [...prev];
      arr.splice(idx + 1, 0, { ...clone(arr[idx]), _id: `block-${Date.now()}` });
      return arr;
    });
    setSelectedIdx(idx + 1);
  }, []);

  const insertBlock = (sample: any, atIdx?: number) => {
    const newBlock = { ...clone(sample), _id: `block-${Date.now()}` };
    setBlocks(prev => {
      const arr = [...prev];
      const pos = atIdx !== undefined && atIdx !== null ? atIdx + 1 : arr.length;
      arr.splice(pos, 0, newBlock);
      return arr;
    });
    setShowBlockPicker(false);
    setInsertAtIndex(null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIdx = prev.findIndex(b => b._id === active.id);
      const newIdx = prev.findIndex(b => b._id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  // --- Array Builders Helpers ---
  const addBadge = (setter: any, arr: string[], val: string) => {
    const clean = val.trim();
    if (clean && !arr.includes(clean)) setter([...arr, clean]);
  };
  const removeBadge = (setter: any, arr: string[], val: string) => {
    setter(arr.filter(item => item !== val));
  };
  const addTask = () => {
    setTasks([...tasks, { id: `task-${Date.now()}`, title: '', platform: 'Instagram' }]);
  };
  const updateTask = (id: string, field: 'title' | 'platform', value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  // --- Unified Save Flow ---
  const handleSave = async () => {
    if (!jobMeta.title.trim() || !jobMeta.brand_name.trim()) {
      toast({ variant: 'destructive', description: "Title and Brand are required." });
      return;
    }
    
    setSaving(true);
    try {
      let cmsPageId = null;

      if (mode === 'pro' && blocks.length > 0) {
        // Build Blocks Payload
        const cmsPayload = {
          slug: 'job-' + Date.now().toString(36),
          title: `Campaign Requirements: ${jobMeta.title}`,
          status: 'published',
          module_key: 'job_marketplace',
          content_json: blocks.map(({ _id, ...rest }: any) => rest),
          meta_json: {}
        };
        const cmsRes = await adminSavePage(cmsPayload);
        if (!cmsRes.ok) throw new Error("Failed to save CMS blocks.");
        cmsPageId = cmsRes.data?.page_id || cmsRes.page_id;
      } else if (mode === 'quick' && quickContent.trim()) {
        // Convert simple text to a single rich-text block in CMS natively to maintain consistency
        const cmsPayload = {
          slug: 'job-' + Date.now().toString(36),
          title: `Campaign Requirements: ${jobMeta.title}`,
          status: 'published',
          module_key: 'job_marketplace',
          content_json: [{ type: 'rich-text', content: quickContent }],
          meta_json: {}
        };
        const cmsRes = await adminSavePage(cmsPayload);
        if (!cmsRes.ok) throw new Error("Failed to save Quick text.");
        cmsPageId = cmsRes.data?.page_id || cmsRes.page_id;
      }

      // 2. Save Job Campaign (Sending JSON stringified arrays to Backend)
      const jobPayload = {
        title: jobMeta.title,
        job_code: jobMeta.job_code || `CMP-${Math.floor(Math.random()*10000)}`,
        brand_name: jobMeta.brand_name,
        quota: Number(jobMeta.quota),
        budget_min: Number(jobMeta.budget_min),
        budget_max: Number(jobMeta.budget_max),
        start_date: jobMeta.start_date,
        deadline_at: jobMeta.deadline_at,
        platform_id: Number(jobMeta.platform_id),
        cms_page_id: cmsPageId,
        job_status: 'open',
        visibility: 'public',
        // Extended Phase 6 fields:
        categories_json: JSON.stringify(categories),
        platforms_json: JSON.stringify(platforms),
        content_type: JSON.stringify(contentTypes), // API uses content_type
        assignment_todo: JSON.stringify(tasks.filter(t => t.title.trim() !== '')) // Checklist
      };

      const res = await jobMarketplaceService.createCampaign(jobPayload);
      if (res.success) {
        toast({ title: 'Success', description: 'Campaign successfully published!' });
        nav('/job-marketplace/campaigns');
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to save campaign.' });
    } finally {
      setSaving(false);
    }
  };

  // --- Render Meta Fields (Shared between Quick and Pro modes) ---
  const renderOperationalMeta = () => (
    <div className="space-y-8">
      {/* 1. Basic Operational Meta */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
          <BriefcaseBusiness className="w-5 h-5 text-emerald-600" /> Operational Meta
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Title</label>
          <Input value={jobMeta.title} onChange={e => setJobMeta({...jobMeta, title: e.target.value})} placeholder="e.g. TikTok Summer Promotion" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Name</label>
            <div 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
              onClick={() => { setShowBrandDropdown(!showBrandDropdown); setBrandSearch(''); }}
            >
              <span className={jobMeta.brand_name ? "text-slate-800 font-medium" : "text-muted-foreground"}>
                {brandLoading ? 'Loading...' : (jobMeta.brand_name || "— Select Brand —")}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>

            {showBrandDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBrandDropdown(false)} />
                <div className="absolute top-11 left-0 w-full z-50 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[380px] overflow-hidden">
                   
                   {/* Add new brand form — top section */}
                   <div className="p-3 border-b flex flex-col gap-2 w-full shrink-0 bg-slate-50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">➕ Register New Brand</div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Brand name..." 
                          className="h-8 text-xs bg-white flex-1" 
                          value={newBrandInput}
                          onChange={e => setNewBrandInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
                        />
                        <Input 
                          placeholder="Industry (optional)" 
                          className="h-8 text-xs bg-white w-28" 
                          value={newBrandIndustry}
                          onChange={e => setNewBrandIndustry(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          className="h-8 px-3 shrink-0 bg-emerald-600 hover:bg-emerald-700"
                          disabled={!newBrandInput.trim() || brandSaving}
                          onClick={handleAddBrand}
                        >
                          {brandSaving ? '...' : <><Plus className="h-3 w-3 mr-1" />Add</>}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400">Brand tersimpan permanen di registry untuk keperluan laporan &amp; analisa.</p>
                   </div>

                   {/* Search inside the dropdown */}
                   <div className="px-3 pt-2 pb-1 shrink-0 border-b">
                      <Input 
                        placeholder="🔍  Search brands..." 
                        className="h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-emerald-500" 
                        value={brandSearch}
                        onChange={e => setBrandSearch(e.target.value)}
                        autoFocus
                      />
                   </div>

                   {/* Scrollable brand list */}
                   <div className="overflow-y-auto p-1 flex-1">
                     {(() => {
                       const filtered = brandOptions.filter(b => b.brand_name.toLowerCase().includes(brandSearch.toLowerCase()));
                       if (filtered.length === 0) return (
                         <div className="px-3 py-6 text-xs text-slate-400 text-center font-medium">
                           No matching brand found.<br/>
                           <span className="text-emerald-600">Use the form above to register it.</span>
                         </div>
                       );
                       return filtered.map(b => (
                         <div 
                           key={b.brand_id || b.brand_name} 
                           className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg cursor-pointer font-medium transition-colors ${
                             jobMeta.brand_name === b.brand_name ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                           }`}
                           onClick={() => {
                             setJobMeta({...jobMeta, brand_name: b.brand_name});
                             setShowBrandDropdown(false);
                           }}
                         >
                           <span>{b.brand_name}</span>
                           {b.industry && <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{b.industry}</span>}
                         </div>
                       ));
                     })()}
                   </div>
                </div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Platform</label>
            <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" value={jobMeta.platform_id} onChange={e => setJobMeta({...jobMeta, platform_id: e.target.value})}>
              <option value="1">Instagram</option>
              <option value="2">TikTok</option>
              <option value="3">YouTube</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Fee (Min)</label>
            <Input type="number" value={jobMeta.budget_min} onChange={e => setJobMeta({...jobMeta, budget_min: Number(e.target.value)})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Fee (IDR)</label>
            <Input type="number" value={jobMeta.budget_max} onChange={e => setJobMeta({...jobMeta, budget_max: Number(e.target.value)})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Quota</label>
            <Input type="number" value={jobMeta.quota} onChange={e => setJobMeta({...jobMeta, quota: Number(e.target.value)})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
               <Input type="date" value={jobMeta.start_date} onChange={e => setJobMeta({...jobMeta, start_date: e.target.value})} />
             </div>
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</label>
               <Input type="date" value={jobMeta.deadline_at} onChange={e => setJobMeta({...jobMeta, deadline_at: e.target.value})} />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Categorization Badges */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
          <Tag className="w-5 h-5 text-amber-500" /> Categorization
         </div>
         {/* Kategori — API-driven multi-select dropdown */}
         <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NICHE / INTERESTS</label>
            
            {/* Selected badges */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {categories.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                    {c}
                    <button type="button" onClick={() => setCategories(prev => prev.filter(x => x !== c))} className="text-amber-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setCategorySearch(''); }}
            >
              <span className="text-muted-foreground text-xs">
                {categoryLoading ? 'Loading...' : `+ Add niche / interest (${categoryOptions.length} available)`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-40" />
            </div>

            {showCategoryDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                <div className="absolute left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col w-full max-h-[370px] overflow-hidden mt-1">

                  {/* Register new niche */}
                  <div className="p-3 border-b flex flex-col gap-2 shrink-0 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">➕ Register New Niche</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Pet Lovers, K-Beauty..."
                        className="h-8 text-xs bg-white flex-1"
                        value={newCategoryInput}
                        onChange={e => setNewCategoryInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        autoFocus
                      />
                      <Button
                        type="button" size="sm"
                        className="h-8 px-3 shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
                        disabled={!newCategoryInput.trim() || categorySaving}
                        onClick={handleAddCategory}
                      >
                        {categorySaving ? '...' : <><Plus className="h-3 w-3 mr-1" />Add</>}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400">Niche tersimpan permanen untuk laporan &amp; analisa.</p>
                  </div>

                  {/* Search */}
                  <div className="px-3 pt-2 pb-1 border-b shrink-0">
                    <Input
                      placeholder="🔍  Search niche..."
                      className="h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-amber-400"
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                    />
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto p-1 flex-1">
                    {(() => {
                      const filtered = categoryOptions.filter(c =>
                        c.category_name.toLowerCase().includes(categorySearch.toLowerCase())
                      );
                      if (filtered.length === 0) return (
                        <div className="px-3 py-6 text-xs text-slate-400 text-center font-medium">
                          No matching niche.<br/>
                          <span className="text-amber-600">Use the form above to register it.</span>
                        </div>
                      );
                      return filtered.map(c => {
                        const selected = categories.includes(c.category_name);
                        return (
                          <div
                            key={c.category_id || c.category_name}
                            className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg cursor-pointer font-medium transition-colors ${
                              selected ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              if (selected) {
                                setCategories(prev => prev.filter(x => x !== c.category_name));
                              } else {
                                setCategories(prev => [...prev, c.category_name]);
                              }
                            }}
                          >
                            <span>{c.category_name}</span>
                            {selected && <span className="text-[10px] text-amber-500 font-bold">✓</span>}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
         </div>
         {/* Platforms — API-driven multi-select dropdown */}
         <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PLATFORMS</label>
            
            {/* Selected badges */}
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {platforms.map(p => (
                  <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-800">
                    {p}
                    <button type="button" onClick={() => setPlatforms(prev => prev.filter(x => x !== p))} className="text-sky-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => { setShowPlatformDropdown(!showPlatformDropdown); setPlatformSearch(''); }}
            >
              <span className="text-muted-foreground text-xs">
                {platformLoading ? 'Loading...' : `+ Add platform (${platformOptions.length} available)`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-40" />
            </div>

            {showPlatformDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlatformDropdown(false)} />
                <div className="absolute left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col w-full max-h-[350px] overflow-hidden mt-1">

                  {/* Register new platform */}
                  <div className="p-3 border-b flex flex-col gap-2 shrink-0 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">➕ Register New Platform</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Threads, LinkedIn..."
                        className="h-8 text-xs bg-white flex-1"
                        value={newPlatformInput}
                        onChange={e => setNewPlatformInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddPlatform()}
                        autoFocus
                      />
                      <Button
                        type="button" size="sm"
                        className="h-8 px-3 shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                        disabled={!newPlatformInput.trim() || platformSaving}
                        onClick={handleAddPlatform}
                      >
                        {platformSaving ? '...' : <><Plus className="h-3 w-3 mr-1" />Add</>}
                      </Button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-3 pt-2 pb-1 border-b shrink-0">
                    <Input
                      placeholder="🔍 Search existing..."
                      className="h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-sky-400"
                      value={platformSearch}
                      onChange={e => setPlatformSearch(e.target.value)}
                    />
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto p-1 flex-1">
                    {(() => {
                      const filtered = platformOptions.filter(p =>
                        p.platform_name.toLowerCase().includes(platformSearch.toLowerCase())
                      );
                      if (filtered.length === 0) return (
                        <div className="px-3 py-6 text-xs text-slate-400 text-center font-medium">No results found.</div>
                      );
                      return filtered.map(p => {
                        const selected = platforms.includes(p.platform_name);
                        return (
                          <div
                            key={p.platform_id || p.platform_name}
                            className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer font-medium transition-colors ${
                              selected ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              if (selected) {
                                setPlatforms(prev => prev.filter(x => x !== p.platform_name));
                              } else {
                                setPlatforms(prev => [...prev, p.platform_name]);
                              }
                            }}
                          >
                            <span>{p.platform_name}</span>
                            {selected && <span className="text-[10px] text-sky-500 font-bold">✓</span>}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
         </div>

         {/* Content Types — API-driven multi-select dropdown */}
         <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CONTENT TYPES</label>
            
            {/* Selected badges */}
            {contentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {contentTypes.map(ct => (
                  <span key={ct} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-800">
                    {ct}
                    <button type="button" onClick={() => setContentTypes(prev => prev.filter(x => x !== ct))} className="text-indigo-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => { setShowContentTypeDropdown(!showContentTypeDropdown); setContentTypeSearch(''); }}
            >
              <span className="text-muted-foreground text-xs">
                {contentTypeLoading ? 'Loading...' : `+ Add content type (${contentTypeOptions.length} available)`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-40" />
            </div>

            {showContentTypeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowContentTypeDropdown(false)} />
                <div className="absolute left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col w-full max-h-[350px] overflow-hidden mt-1">

                  {/* Register new content type */}
                  <div className="p-3 border-b flex flex-col gap-2 shrink-0 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">➕ Register New Content Type</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Livestream, Podcast..."
                        className="h-8 text-xs bg-white flex-1"
                        value={newContentTypeInput}
                        onChange={e => setNewContentTypeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddContentType()}
                        autoFocus
                      />
                      <Button
                        type="button" size="sm"
                        className="h-8 px-3 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={!newContentTypeInput.trim() || contentTypeSaving}
                        onClick={handleAddContentType}
                      >
                        {contentTypeSaving ? '...' : <><Plus className="h-3 w-3 mr-1" />Add</>}
                      </Button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-3 pt-2 pb-1 border-b shrink-0">
                    <Input
                      placeholder="🔍 Search existing..."
                      className="h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-indigo-400"
                      value={contentTypeSearch}
                      onChange={e => setContentTypeSearch(e.target.value)}
                    />
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto p-1 flex-1">
                    {(() => {
                      const filtered = contentTypeOptions.filter(ct =>
                        ct.type_name.toLowerCase().includes(contentTypeSearch.toLowerCase())
                      );
                      if (filtered.length === 0) return (
                        <div className="px-3 py-6 text-xs text-slate-400 text-center font-medium">No results found.</div>
                      );
                      return filtered.map(ct => {
                        const selected = contentTypes.includes(ct.type_name);
                        return (
                          <div
                            key={ct.type_id || ct.type_name}
                            className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer font-medium transition-colors ${
                              selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              if (selected) {
                                setContentTypes(prev => prev.filter(x => x !== ct.type_name));
                              } else {
                                setContentTypes(prev => [...prev, ct.type_name]);
                              }
                            }}
                          >
                            <span>{ct.type_name}</span>
                            {selected && <span className="text-[10px] text-indigo-500 font-bold">✓</span>}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
         </div>
      </div>

      {/* 3. Checklist Tasks */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
          <CheckSquare className="w-5 h-5 text-sky-500" /> Checklist (To Do Assignments)
         </div>
         <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={task.id} className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm pr-3">
                 <div className="text-slate-300 font-mono text-xs pl-2 shrink-0">{i+1}</div>
                 <Input value={task.title} onChange={e => updateTask(task.id, 'title', e.target.value)} placeholder="Task..." className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2" />
                 <select value={task.platform} onChange={e => updateTask(task.id, 'platform', e.target.value)} className="w-[120px] h-8 text-xs bg-slate-50 border-0 rounded-lg text-slate-600 shrink-0 outline-none px-2">
                   {['Instagram', 'TikTok', 'Twitter', 'YouTube', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={addTask} className="w-full py-2.5 mt-2 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-medium hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Next Task
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col bg-slate-50 border rounded-xl overflow-hidden shadow-xl ${mode === 'pro' ? 'h-[calc(100vh-100px)]' : 'min-h-[calc(100vh-100px)]'}`}>
      {/* ─── Top Bar ─── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav('/job-marketplace/campaigns')} className="text-slate-400 hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900 leading-none">
               Create Campaign <span className="bg-slate-100 text-slate-500 text-[10px] ml-2 px-2 py-0.5 rounded-full uppercase tracking-widest align-middle border">{mode === 'quick' ? '⚡ QUICK' : '✨ PRO'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Job Marketplace Backend Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button disabled={saving} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-md h-10 px-6 rounded-full font-bold">
            <Globe className="w-4 h-4 mr-2" /> {saving ? 'Publishing...' : 'Publish Campaign'}
          </Button>
        </div>
      </div>

      {mode === 'pro' ? (
        // ======================= PRO MODE (SIDE-BY-SIDE) =======================
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-white border-r">
             <div className="max-w-3xl mx-auto space-y-4">
                <div className="mb-8">
                   <h2 className="text-2xl font-black text-slate-900 mb-2">Campaign Canvas</h2>
                   <p className="text-slate-500 text-sm">Write the Scope of Work, References, and Requirements using rich blocks.</p>
                </div>

                {blocks.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50/50">
                    <LayoutTemplate className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <div className="text-slate-400 font-medium">No SOW blocks yet</div>
                    <button onClick={() => { setInsertAtIndex(null); setShowBlockPicker(true); }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">
                      <Plus className="w-4 h-4" /> Start Writing Campaign SOW
                    </button>
                  </div>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map(b => b._id)} strategy={verticalListSortingStrategy}>
                    {blocks.map((block, idx) => (
                      <SortableBlockCard
                        key={block._id}
                        block={block}
                        index={idx}
                        totalBlocks={blocks.length}
                        isSelected={selectedIdx === idx}
                        onSelect={(i: number) => setSelectedIdx(i)}
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
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all shadow-sm">
                      <Plus className="w-4 h-4" /> Add Next Block
                    </button>
                  </div>
                )}
             </div>
          </div>
          {/* Right Sidebar Meta */}
          <div className="w-[420px] flex flex-col bg-[#fafafa] shrink-0">
            <div className="flex-1 overflow-y-auto">
               <div className="p-6 space-y-8">
                  {renderOperationalMeta()}

                  {/* Block Inspector Sub-Section */}
                  <div className="space-y-4 pt-8 border-t border-slate-200">
                     <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
                       <Settings className="w-5 h-5 text-emerald-600" /> SOW Block Inspector
                     </div>
                     <div className="bg-white rounded-xl shadow-sm border p-4">
                        <BlockInspector
                          block={selectedBlock}
                          onUpdate={(data) => selectedIdx !== null && updateBlock(selectedIdx, data)}
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Block Picker Modal */}
          {showBlockPicker && (
            <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center backdrop-blur-sm" onClick={() => setShowBlockPicker(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add Campaign Component</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Build your Scope of Work dynamically</p>
                  </div>
                  <button onClick={() => setShowBlockPicker(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {BLOCK_CATALOG.map(b => (
                    <button key={b.key} onClick={() => insertBlock(b.sample, insertAtIndex ?? undefined)}
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-md transition-all text-left group">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                        <b.icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700">{b.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{b.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      ) : (
        // ======================= QUICK MODE (SINGLE COLUMN) =======================
        <div className="flex-1 w-full bg-[#fafafa]">
           <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-32">
              
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm leading-relaxed mb-6">
                <strong>⚡ Quick Post Enabled.</strong> Fill out the meta details below and write the campaign content directly in the text area. 
                Perfect for fast mobile execution. Switch back to Professional for block dragging.
              </div>

              {renderOperationalMeta()}

              {/* Quick Simple SOW Content */}
              <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                 <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
                   <LayoutTemplate className="w-5 h-5 text-indigo-500" /> SOW (Scope of Work) Description
                 </div>
                 <div className="bg-white rounded-xl shadow-sm border p-1 border-slate-200 overflow-hidden">
                    <Textarea 
                      value={quickContent}
                      onChange={e => setQuickContent(e.target.value)}
                      placeholder="Write your campaign details, deliverables, and rules here..."
                      className="min-h-[300px] border-0 outline-none focus-visible:ring-0 text-base leading-relaxed p-4 bg-transparent resize-y"
                    />
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
