import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Search, 
  BarChart3, 
  Calendar,
  Link as LinkIcon,
  QrCode,
  Shield,
  ShieldOff,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ShortURL {
  id: number;
  short_code: string;
  target_url: string;
  title: string;
  click_count: number;
  require_login: number;
  created_at: string;
  active: number;
}

const QRDashboard = () => {
  const [links, setLinks] = useState<ShortURL[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/hots_url/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hots_tokek")}` }
      });
      setLinks(response.data.data);
    } catch (error) {
      console.error("Failed to fetch links:", error);
      toast.error("Failed to load your links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/hots_url/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hots_tokek")}` }
      });
      toast.success("Link deleted successfully");
      fetchLinks();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard", {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
    });
  };

  const filteredLinks = links.filter(link => 
    link.title?.toLowerCase().includes(search.toLowerCase()) || 
    link.short_code.toLowerCase().includes(search.toLowerCase()) ||
    link.target_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-8 h-8 text-primary" />
            My QR & Short Links
          </h1>
          <p className="text-gray-500">Manage and track your branded QR codes</p>
        </div>
        <Button onClick={() => navigate('/service-catalog/qr-creator')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New QR
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary/70">Total Links</p>
                <p className="text-3xl font-bold text-primary">{links.length}</p>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
                <LinkIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600/70">Total Scans/Clicks</p>
                <p className="text-3xl font-bold text-purple-600">
                  {links.reduce((acc, curr) => acc + curr.click_count, 0)}
                </p>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600/70">Private Links</p>
                <p className="text-3xl font-bold text-orange-600">
                  {links.filter(l => l.require_login).length}
                </p>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by title, code or URL..." 
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase font-bold tracking-widest">
                  <th className="px-6 py-4">Status & Title</th>
                  <th className="px-6 py-4">Short Link</th>
                  <th className="px-6 py-4 text-center">Clicks</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-gray-400">Loading your links...</td>
                  </tr>
                ) : filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-gray-400 font-medium">
                        No links found. Create your first QR code!
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map(link => (
                    <tr key={link.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            link.active ? "bg-green-500" : "bg-gray-300"
                          )} />
                          <div>
                            <p className="font-semibold text-gray-900">{link.title || 'Untitled'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{link.target_url}</p>
                          </div>
                          {link.require_login ? (
                            <div title="Requires Login">
                              <Shield className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                          ) : (
                            <div title="Public Link">
                               <ShieldOff className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center gap-2 text-primary font-mono text-sm cursor-pointer hover:underline"
                          onClick={() => copyToClipboard(link.short_code)}
                        >
                          /s/{link.short_code}
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-600">
                          {link.click_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          {format(new Date(link.created_at), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => copyToClipboard(link.short_code)} className="gap-2">
                                <Copy className="w-4 h-4" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/s/${link.short_code}`, '_blank')} className="gap-2">
                                <ExternalLink className="w-4 h-4" /> Open Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(link.id)} className="text-red-600 gap-2 font-medium">
                                <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRDashboard;
