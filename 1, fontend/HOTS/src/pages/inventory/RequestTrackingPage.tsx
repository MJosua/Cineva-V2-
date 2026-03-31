import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Search, Loader2, ArrowRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useNavigate } from 'react-router-dom';

interface RequestTicket {
  ticket_id: number;
  service_id: number;
  service_name: string;
  status: string;
  created_at: string;
  creator_name: string;
  form_json: any;
}

/**
 * Request Tracking Page
 * Groups IT Asset and POSM requests by date
 */
const RequestTrackingPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hots_tokek');
      const response = await axios.get(`${API_URL}/hots_ticket/all_ticket`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const filtered = response.data.data.filter((t: any) => 
          t.service_id === 14 || t.service_id === 19
        );
        setRequests(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Use useMemo for grouping + sorting
  const sortedDateGroups = React.useMemo(() => {
    const filtered = requests.filter(req => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (
        req.creator_name?.toLowerCase().includes(search) ||
        req.service_name?.toLowerCase().includes(search) ||
        String(req.ticket_id).includes(search)
      );
      const matchesStatus = statusFilter === "all" || req.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    const groups: { [key: string]: RequestTicket[] } = {};
    filtered.forEach(req => {
      const date = new Date(req.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(req);
    });

    // Sort dates descending (newest first)
    return Object.keys(groups).sort((a, b) => {
        return new Date(groups[b][0].created_at).getTime() - new Date(groups[a][0].created_at).getTime();
    }).map(date => ({ date, items: groups[date] }));
  }, [requests, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'closed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Request Tracking</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage all inventory-related requests</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              className="pl-10 h-10 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="h-10 px-3 rounded-md bg-background/50 border border-input text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Timeline of Groups */}
      <div className="space-y-12 pt-4">
        {sortedDateGroups.length > 0 ? (
          sortedDateGroups.map(({ date, items }) => (
            <div key={date} className="relative pl-10 space-y-4">
              {/* Vertical Line */}
              <div className="absolute left-0 top-0 bottom-[-48px] w-px bg-slate-200">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-slate-100 border-2 border-primary shadow-sm" />
              </div>
              
              {/* Sticky Date Header */}
              <div className="sticky top-0 z-10 py-1 bg-background/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{date}</h3>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">
                  {items.length} {items.length === 1 ? 'Request' : 'Requests'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((req) => (
                  <Card key={req.ticket_id} className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer overflow-hidden border-slate-100 bg-card/40 backdrop-blur-sm" onClick={() => navigate(`/ticket-detail/${req.ticket_id}`)}>
                    <CardHeader className="p-4 pb-2">
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                           <div className={`p-1.5 rounded-lg ${req.service_id === 14 ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                              <Package className={`w-4 h-4 ${req.service_id === 14 ? 'text-orange-500' : 'text-blue-500'}`} />
                           </div>
                           <span className="text-xs font-mono text-slate-400">#{req.ticket_id}</span>
                         </div>
                         <Badge variant="secondary" className={`text-[10px] ${getStatusColor(req.status)}`}>
                           {req.status}
                         </Badge>
                       </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <h4 className="font-bold text-slate-700 mb-1">{req.service_name}</h4>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Requested by</p>
                          <p className="text-sm font-medium">{req.creator_name || 'System User'}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform p-0 h-auto">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">No requests found</h3>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestTrackingPage;
