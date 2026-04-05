import React, { useEffect, useState } from 'react';
import { jobMarketplaceService, JobItem } from '@/services/jobMarketplaceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Building2, Users, Megaphone, ChevronRight, Search, Plus, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function JobMarketplaceCampaigns() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobMarketplaceService.getJobs({ limit: 100 });
        setJobs(res.data?.jobs || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) || 
    j.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">Campaign Master</h1>
          <p className="text-slate-500 mt-1">Core view for job listing and operational campaigns.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-10 h-10" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#cd9a36] hover:bg-[#b0842e] text-white shrink-0 h-10 shadow-sm border-0 pr-3 pl-4 focus:ring-0">
                <Plus className="mr-2 h-4 w-4" /> Post Campaign <ChevronDown className="ml-2 h-4 w-4 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[260px] p-2 rounded-2xl shadow-xl border-slate-100">
              <DropdownMenuItem className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors focus:bg-slate-50" onClick={() => navigate('/job-marketplace/admin/create?mode=quick')}>
                <div className="bg-amber-100/50 p-2.5 rounded-full shrink-0">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-800 text-sm">Quick Post</span>
                  <span className="text-xs text-slate-500 font-medium tracking-tight">Mobile-friendly, easy mode</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mt-1 focus:bg-slate-50" onClick={() => navigate('/job-marketplace/admin/create?mode=pro')}>
                <div className="bg-purple-100/50 p-2.5 rounded-full shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-800 text-sm">Professional Builder</span>
                  <span className="text-xs text-slate-500 font-medium tracking-tight">Advanced drag & drop design</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length > 0 ? filtered.map((job) => (
            <Card key={job.job_id} className="group hover:shadow-xl transition-all border-slate-200 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">{job.job_code}</Badge>
                    <CardTitle className="text-xl group-hover:text-emerald-700 transition-colors">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 font-medium">
                       <Building2 className="h-3 w-3" /> {job.brand_name || 'Brand TBD'}
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Megaphone className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-500" />{job.quota} Spots</div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-500" />{job.deadline_at ? new Date(job.deadline_at).toLocaleDateString() : 'TBD'}</div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                   <Badge className={job.job_status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                     {job.job_status.toUpperCase()}
                   </Badge>
                   <Button variant="ghost" size="sm" onClick={() => navigate(`/job-marketplace/detail/${job.job_id}`)}>
                     Manage <ChevronRight className="ml-1 h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400">No campaigns found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
