import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminListPages } from '@/api/cms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Plus, FileText, Globe, Edit, Eye, ExternalLink, Search,
  Loader2, FileWarning, Clock, CheckCircle, Sparkles
} from 'lucide-react';

export default function CmsAdminList() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    adminListPages().then(json => {
      if (json.ok) setPages(json.pages || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredPages = pages.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedCount = pages.filter(p => p.status === 'published').length;
  const draftCount = pages.filter(p => p.status === 'draft').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CMS Pages</h1>
              <p className="text-gray-500">Manage your content pages and dashboards</p>
            </div>
          </div>
          <Button
            onClick={() => nav('/admin/cms/new')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Page
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-800">{pages.length}</div>
                <div className="text-sm text-blue-600">Total Pages</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{publishedCount}</div>
                <div className="text-sm text-green-600">Published</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-800">{draftCount}</div>
                <div className="text-sm text-orange-600">Drafts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search pages by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Page List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <FileWarning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No pages found' : 'No pages yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first page to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => nav('/admin/cms/new')}>
                <Plus className="w-4 h-4 mr-2" /> Create First Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPages.map((p) => (
            <Card
              key={p.page_id}
              className="overflow-hidden hover:shadow-lg transition-shadow group border-gray-200"
            >
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.status === 'published'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-orange-100 text-orange-600'
                        }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {p.title || 'Untitled'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">/{p.slug}</code>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={p.status === 'published' ? 'default' : 'secondary'}
                      className={p.status === 'published'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                      }
                    >
                      {p.status === 'published' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Published</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Draft</>
                      )}
                    </Badge>
                  </div>

                  {p.summary && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.summary}</p>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => nav(`/admin/cms/edit/${p.page_id}`)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/hots/page/${encodeURIComponent(p.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Tips */}
      <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Pro Tip: Custom Dashboard</h3>
              <p className="text-purple-700 text-sm">
                Create a page with slug <code className="px-1.5 py-0.5 bg-purple-100 rounded text-xs font-mono">dashboard-home</code> to
                replace the default dashboard with your custom widgets and content!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
