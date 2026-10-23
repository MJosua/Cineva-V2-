import React, { useEffect, useMemo, useState } from 'react';
import { jobMarketplaceService, JobItem } from '@/services/jobMarketplaceService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Building2, CalendarDays, CheckCircle2, ChevronRight, Filter, MapPin, Megaphone, Search, ShieldCheck, Smartphone, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useToast } from '@/hooks/use-toast';

const JobMarketplace: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('market');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector(state => state.auth);

  const isPIC = useMemo(() => {
    const roleId = user?.role_id?.toString();
    return roleId === '4' || roleId === '1'; // Admin or System
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const [jobsData, reqsData] = await Promise.all([
        jobMarketplaceService.getJobs({ limit: 60 }),
        jobMarketplaceService.listMyRequests()
      ]);
      setJobs(jobsData?.data?.jobs || []);
      setMyRequests(reqsData?.data || []);
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTakeJob = async (jobId: number) => {
    try {
      const res = await jobMarketplaceService.takeJob(jobId);
      if (res.success) {
        toast({
          title: "Request Sent",
          description: "Your request to join this campaign has been sent to the PIC.",
        });
        load();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to take job",
        description: err.response?.data?.message || "Something went wrong",
      });
    }
  };

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((job) =>
      [job.title, job.brand_name, job.platform_name, job.category_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [jobs, search]);

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => ['open', 'draft'].includes(j.job_status)).length,
    brandCount: new Set(jobs.map((j) => j.brand_name).filter(Boolean)).size,
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Zap className="h-8 w-8 animate-pulse text-emerald-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Syncing marketplace data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="overflow-hidden border-0 shadow-2xl bg-slate-950 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Briefcase className="h-40 w-40 text-emerald-500" />
          </div>
          <CardHeader className="pb-4 relative z-10">
            <Badge className="w-fit bg-emerald-500/20 text-emerald-300 border-emerald-500/30">HOTS Job Marketplace</Badge>
            <CardTitle className="mt-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Connect. Execute. <span className="text-emerald-400">Grow.</span>
            </CardTitle>
            <CardDescription className="mt-4 text-slate-300 text-lg max-w-2xl leading-relaxed">
              Platform kolaborasi terpadu untuk Campaign, Batch, Lokasi, dan Talent. 
              {isPIC ? " Kelola operasional campaign Anda secara efisien." : " Temukan peluang campaign terbaik untuk profil Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 relative z-10 pb-8">
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
              <Briefcase className="h-5 w-5 text-emerald-400" />
              <div className="mt-2 text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Active Jobs</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
              <Building2 className="h-5 w-5 text-sky-400" />
              <div className="mt-2 text-2xl font-bold">{stats.brandCount}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Brands</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
              <div className="mt-2 text-2xl font-bold">{stats.open}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Available</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xl bg-white/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Operational Stack
            </CardTitle>
            <CardDescription>Workflow layers in this engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { icon: ShieldCheck, label: 'Auth & Profile', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Briefcase, label: 'Campaign Master', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: MapPin, label: 'Batch & Locations', color: 'text-rose-600', bg: 'bg-rose-50' },
              { icon: Users, label: 'Talent Assignment', color: 'text-violet-600', bg: 'bg-violet-50' },
              { icon: Smartphone, label: 'Work Performance', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((layer) => (
              <div key={layer.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${layer.bg}`}>
                  <layer.icon className={`h-4 w-4 ${layer.color}`} />
                </div>
                <span className="font-medium text-slate-700">{layer.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-xl md:flex-row md:items-center md:justify-between border-slate-100">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Available Campaigns</h2>
          <p className="text-sm text-slate-500">Filter by brand, platform, or category.</p>
        </div>
        <div className="flex w-full gap-2 md:w-[420px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search jobs..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
            />
          </div>
          <Button variant="outline" className="h-11 border-slate-200">
            <Filter className="mr-2 h-4 w-4" />Filter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 rounded-xl">
          <TabsTrigger value="market" className="rounded-lg px-6 py-2 transition-all">Explore Marketplace</TabsTrigger>
          <TabsTrigger value="my_jobs" className="rounded-lg px-6 py-2 transition-all">My Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredJobs.length > 0 ? filteredJobs.map((job) => (
              <Card key={job.job_id} className="group border-slate-200 shadow-sm transition-all hover:shadow-2xl hover:border-emerald-200 overflow-hidden bg-white">
                <div className="h-2 bg-emerald-500/20 group-hover:bg-emerald-500 transition-all" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{job.category_name || 'General'}</Badge>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest">{job.job_code}</span>
                      </div>
                      <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 text-slate-600 font-medium">
                         <Building2 className="h-3 w-3" /> {job.brand_name || 'Confidential Brand'}
                      </CardDescription>
                    </div>
                    <Badge className="bg-sky-500/10 text-sky-700 border-sky-200 hover:bg-sky-500/20">{job.platform_name || 'Omnichannel'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <span>{job.quota} Spots</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <CalendarDays className="h-4 w-4 text-rose-600" />
                      <span>{job.deadline_at ? new Date(job.deadline_at).toLocaleDateString() : 'Continuous'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-tighter">Budget Allocation</p>
                      <p className="text-emerald-600 font-bold text-lg">
                        {job.budget_max ? `Up to ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(job.budget_max)}` : 'Competitive Rate'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       {!isPIC && (
                        <Button 
                          variant="outline" 
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleTakeJob(job.job_id)}
                        >
                          Join
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={() => navigate(`/job-marketplace/detail/${job.job_id}`)}
                      >
                        Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400">No campaigns found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my_jobs">
           <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
             <div className="max-w-md mx-auto space-y-4">
                <Zap className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold">Monitor your active requests.</h3>
                <p className="text-sm text-slate-500">
                  {isPIC 
                    ? "Manage campaigns where you are assigned as PIC. Tracking will appear here." 
                    : "Requests you've joined and assignments currently in progress will be visible in this tab."}
                </p>
                <Button variant="outline" onClick={() => navigate('/my-assignments')}>
                  Go to Assignments Hub
                </Button>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobMarketplace;
