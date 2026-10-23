import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListPages, adminDeletePage, fetchCategories, quickUpdateField, quickUpdateCategory } from '@/api/cms';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, Plus, Edit3, Trash2, Eye, ArrowUpDown, Filter,
  FileText, ChevronDown, Calendar, User, Pin
} from 'lucide-react';

const MODULE_KEY_OPTIONS = [
  { value: '', label: 'None', color: 'text-slate-400' },
  { value: 'update', label: 'FAQ & Update', color: 'text-orange-600 bg-orange-50' },
  { value: 'guide', label: 'User Guide', color: 'text-green-600 bg-green-50' },
  { value: 'admin_guide', label: 'Admin Guide', color: 'text-blue-600 bg-blue-50' },
  { value: 'blog', label: 'Blog', color: 'text-purple-600 bg-purple-50' },
  { value: 'notice', label: 'Notices', color: 'text-rose-600 bg-rose-50' },
  { value: 'notification', label: 'Notification', color: 'text-indigo-600 bg-indigo-50' },
];

export default function CmsAdminList() {
  const nav = useNavigate();
  const [pages, setPages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterModuleKey, setFilterModuleKey] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, catsRes] = await Promise.all([
        adminListPages({
          search: search || undefined,
          category_id: filterCategory || undefined,
          module_key: filterModuleKey || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          sort_by: sortBy,
          sort_dir: sortDir
        }),
        fetchCategories()
      ]);
      setPages(postsRes.pages || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      console.error("CMS ADMIN LIST ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterModuleKey, filterStatus, sortBy, sortDir]);

  // Combined effect with debounce to prevent mount-time collision and spam
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 100); // Fast debounce for filters
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await adminDeletePage(id);
    if (res.ok) loadData();
    else alert('Delete failed: ' + (res.message || 'unknown'));
  };

  const handleQuickModuleKey = async (pageId: number, value: string) => {
    await quickUpdateField(pageId, 'module_key', value);
    loadData();
  };

  const handleQuickCategory = async (pageId: number, catId: string) => {
    await quickUpdateCategory(pageId, catId);
    loadData();
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getModuleKeyBadge = (mk: string) => {
    const opt = MODULE_KEY_OPTIONS.find(o => o.value === mk);
    if (!opt || !opt.value) return <span className="text-slate-300 text-xs">—</span>;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${opt.color}`}>{opt.label}</span>;
  };

  const stats = useMemo(() => ({
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
  }), [pages]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            CMS Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage blog posts, updates, and help articles</p>
        </div>
        <Button
          onClick={() => nav('/admin/cms/edit/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Posts', value: stats.total, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Published', value: stats.published, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Drafts', value: stats.draft, color: 'text-amber-600', bg: 'bg-amber-50/50' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border shadow-sm`}>
            <CardContent className="py-4 px-5">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Filters Bar ─── */}
      <Card className="shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search posts by title, slug, or summary..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c: any) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
               </select>
               <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
             </div>
 
             {/* Module Filter */}
             <div className="relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
               <select
                 value={filterModuleKey}
                 onChange={e => setFilterModuleKey(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-blue-100 outline-none min-w-[140px]"
              >
                <option value="">All Modules</option>
                {MODULE_KEY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(['all', 'published', 'draft'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterStatus === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Drafts'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Posts Table ─── */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider w-10"></th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('title')}>
                  <span className="inline-flex items-center gap-1">Title <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('category')}>
                  <span className="inline-flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('module_key')}>
                  <span className="inline-flex items-center gap-1">Module <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Author</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('updated')}>
                  <span className="inline-flex items-center gap-1">Modified <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Loading...</td></tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <div className="text-slate-400 font-medium">No posts found</div>
                    <div className="text-slate-300 text-xs mt-1">Create your first post to get started</div>
                  </td>
                </tr>
              ) : pages.map((page: any) => (
                <tr key={page.page_id} className="hover:bg-blue-50/30 transition-colors group">
                  {/* Thumbnail */}
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {page.thumbnail ? (
                        <img src={page.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </td>

                  {/* Title + Slug */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                       <div
                         className="font-semibold text-slate-800 group-hover:text-blue-600 cursor-pointer transition-colors truncate max-w-[240px]"
                         onClick={() => nav(`/admin/cms/edit/${page.page_id}`)}
                       >
                         {page.title || 'Untitled'}
                       </div>
                       {page.is_pinned === 1 && (
                         <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                       )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">/{page.slug}</div>
                  </td>

                  {/* Category — Inline Select */}
                  <td className="py-3 px-4">
                    <select
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer min-w-[120px]"
                      value={(() => {
                        let meta = page.meta_json;
                        if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = {}; } }
                        return meta?.category_id || '';
                      })()}
                      onChange={e => handleQuickCategory(page.page_id, e.target.value)}
                    >
                      <option value="">— None —</option>
                      {categories.map((c: any) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Module Key — Inline Select */}
                  <td className="py-3 px-4">
                    <select
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer min-w-[110px]"
                      value={page.module_key || ''}
                      onChange={e => handleQuickModuleKey(page.page_id, e.target.value)}
                    >
                      {MODULE_KEY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      page.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${page.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {page.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      {page.author_name || `User #${page.created_by || '?'}`}
                    </div>
                  </td>

                  {/* Modified */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(page.updated_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Edit" onClick={() => nav(`/admin/cms/edit/${page.page_id}`)}
                        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button title="View" onClick={() => window.open(`/hots/page/${page.slug}`, '_blank')}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button title="Delete" onClick={() => handleDelete(page.page_id, page.title)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
