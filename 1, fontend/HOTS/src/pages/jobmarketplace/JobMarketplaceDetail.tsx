import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobMarketplaceService, JobItem, Batch, Location, Applicant, Assignment } from '@/services/jobMarketplaceService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, CalendarDays, MapPin, Users, Workflow, 
  ChevronLeft, Info, Layers3, ClipboardList, CheckCircle2, 
  ExternalLink, MessageSquare, AlertCircle, Zap, Clock
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function JobMarketplaceDetail() {
  const { job_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobItem | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contentLogs, setContentLogs] = useState<any[]>([]);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [draftLink, setDraftLink] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPIC = user?.role_id?.toString() === '4' || user?.role_id?.toString() === '1';

  const loadAllData = async () => {
    if (!job_id) return;
    try {
      setLoading(true);
      const res = await jobMarketplaceService.getJobDetail(job_id);
      if (res.success) {
        const jobData = res.data;
        setJob(jobData);

        // Fetch related data
        const promises: Promise<any>[] = [];
        if (jobData.campaign_id) {
          promises.push(jobMarketplaceService.getBatches(jobData.campaign_id));
          promises.push(jobMarketplaceService.getAssignments(jobData.campaign_id));
          promises.push(jobMarketplaceService.getContentLogs(jobData.campaign_id));
        }

        const results = await Promise.all(promises);
        if (jobData.campaign_id) {
          setBatches(results[0]?.data || []);
          setAssignments(results[1]?.data || []);
          setContentLogs(results[2]?.data || []);
        }

        if (isPIC) {
          const appRes = await jobMarketplaceService.getApplicants(job_id);
          setApplicants(appRes.applicants || []);
        }
      }
    } catch (err) {
      console.error('Failed to load job detail:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load campaign details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [job_id]);

  const handleApprove = async (pickupId: number, batchId: number, locationId: number) => {
    try {
      if (!job?.campaign_id) return;
      const res = await jobMarketplaceService.approveApplicant(pickupId, job.campaign_id, batchId, locationId);
      if (res.success) {
        toast({ title: "Approved", description: "Talent officially assigned." });
        loadAllData();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to approve" });
    }
  };

  const handleSubmitContent = async () => {
    if (!job?.my_assignment?.assignment_id) return;
    if (!draftLink.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please provide a valid link." });
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await jobMarketplaceService.submitContentLog(job.my_assignment.assignment_id, draftLink, draftNotes);
      if (res.success) {
        toast({ title: "Success", description: "Content draft submitted successfully." });
        setSubmitModalOpen(false);
        setDraftLink('');
        setDraftNotes('');
        loadAllData(); // Refresh workflow logs
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to submit content" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Zap className="h-8 w-8 animate-pulse text-emerald-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading operational data...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <Button variant="link" onClick={() => navigate('/job-marketplace')}>Back to Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/job-marketplace')} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
           <Badge className="bg-emerald-500 text-white border-0">{job.job_status.toUpperCase()}</Badge>
           <Badge variant="outline">{job.visibility.toUpperCase()}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
               <span className="flex items-center gap-1.5 font-bold text-slate-900 border-r pr-4">
                 <Building2 className="h-4 w-4 text-sky-600" /> {job.brand_name || 'Brand Confidential'}
               </span>
               <span className="flex items-center gap-1.5 border-r pr-4">
                 <CalendarDays className="h-4 w-4" /> Posted {new Date(job.created_at).toLocaleDateString()}
               </span>
               <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                 <Zap className="h-4 w-4" /> {job.platform_name || 'All Platforms'}
               </span>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 p-0 gap-8">
              <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 font-bold">Overview</TabsTrigger>
              <TabsTrigger value="execution" className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 font-bold">Batches & Locations</TabsTrigger>
              <TabsTrigger value="talent" className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 font-bold">Talent Flow</TabsTrigger>
              <TabsTrigger value="workflow" className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 font-bold">Workflow Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 italic">
                    <Info className="h-4 w-4 text-sky-500" /> Objective
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-700 leading-relaxed">
                  {job.objective || "No specific objective defined for this campaign."}
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 italic">
                    <ClipboardList className="h-4 w-4 text-emerald-500" /> Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {job.description || "Refer to general SOW for this platform."}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="pt-6">
               <div className="grid gap-4 md:grid-cols-2">
                 {batches.length > 0 ? batches.map(batch => (
                    <Card key={batch.batch_id} className="border-slate-200">
                      <CardHeader className="bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-bold">{batch.batch_name}</CardTitle>
                          <Badge variant="secondary">Order #{batch.batch_order}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Locations in this batch</p>
                        <div className="space-y-2">
                           <div className="text-sm p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 flex items-center gap-2">
                              <MapPin className="h-3 w-3" /> Area Coverage Logic Enabled
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                 )) : (
                   <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl">
                      <Layers3 className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400">No batches defined for this operational cycle.</p>
                   </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="talent" className="pt-6 space-y-6">
                {!isPIC && job.my_assignment && (
                  <Card className="border-emerald-200 shadow-lg bg-emerald-50/20 overflow-hidden">
                    <div className="h-2 bg-emerald-500" />
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Zap className="h-6 w-6 text-emerald-600" /> Your Personal Workspace
                      </CardTitle>
                      <CardDescription>You are officially assigned to this campaign. Track your work and submit links here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                         <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Assignment ID</p>
                            <p className="text-lg font-bold">#{job.my_assignment.assignment_id}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                            <Badge className="mt-1 bg-emerald-500">{job.my_assignment.status_visit?.toUpperCase() || 'ASSIGNEE'}</Badge>
                         </div>
                      </div>

                      <div className="flex gap-4">
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 text-base"
                          onClick={() => setSubmitModalOpen(true)}
                        >
                          Submit Draft Link
                        </Button>
                        <Button variant="outline" className="flex-1 h-11 text-base border-emerald-200 text-emerald-700">
                          Submit Proof of Posting
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isPIC && job.my_pickup && job.my_pickup.pickup_status === 'requested' && !job.my_assignment && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="pt-6">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-amber-100">
                             <Clock className="h-6 w-6 text-amber-600" />
                          </div>
                          <div className="space-y-1">
                             <h3 className="font-bold text-lg">Application Pending Review</h3>
                             <p className="text-sm text-slate-600">The PIC is currently reviewing your profile for this campaign. We'll notify you once you're approved.</p>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                )}

                {isPIC && (
                  <Card className="border-slate-200 shadow-md">
                    <CardHeader className="border-b bg-amber-50/30">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-600" /> Applicants ({applicants.length})
                      </CardTitle>
                      <CardDescription>Review and approve join requests with social profile metrics.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {applicants.length > 0 ? (
                        <div className="divide-y">
                          {applicants.map(app => (
                            <div key={app.pickup_id} className="p-4 flex flex-col gap-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                    {app.firstname[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{app.firstname} {app.lastname}</p>
                                    <p className="text-xs text-slate-500">Applied {new Date(app.picked_at || app.created_at || Date.now()).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">View Metrics</Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleApprove(app.pickup_id, batches[0]?.batch_id || 1, 1)}
                                    disabled={batches.length === 0}
                                  >
                                    Approve
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex gap-3 px-1">
                                {(app as any).followers_ig && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 bg-pink-50 text-pink-600 border-pink-100">
                                    IG: {(app as any).followers_ig}
                                  </Badge>
                                )}
                                {(app as any).followers_tt && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 bg-slate-50 text-slate-600 border-slate-200">
                                    TT: {(app as any).followers_tt}
                                  </Badge>
                                )}
                                {(app as any).niche && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 bg-blue-50 text-blue-600 border-blue-100">
                                    Niche: {(app as any).niche}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400">No active applicants.</div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200 shadow-md">
                  <CardHeader className="border-b bg-sky-50/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sky-600" /> All Assigned Talents ({assignments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {assignments.length > 0 ? assignments.map(asn => (
                        <div key={asn.assignment_id} className="p-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Badge className="bg-sky-100 text-sky-700 border-sky-200 h-6">Active</Badge>
                              <span className="font-medium">{asn.firstname} {asn.lastname}</span>
                           </div>
                           <Button variant="ghost" size="sm" className="text-slate-400">
                             <ExternalLink className="h-4 w-4" />
                           </Button>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-400">No assignments confirmed yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="workflow" className="pt-6">
               <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/20 border-b">
                     <CardTitle className="text-lg flex items-center gap-2">
                       <Workflow className="h-5 w-5 text-indigo-500" /> Operational Progress
                     </CardTitle>
                     <CardDescription>Live timeline of content submissions and status updates.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                     {contentLogs.length > 0 ? (
                       <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 py-2">
                         {contentLogs.map((log, idx) => (
                           <div key={log.content_log_id || idx} className="relative">
                             <div className={`absolute -left-[41px] top-0 h-4 w-4 rounded-full ring-4 ring-white ${
                               log.content_status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                             }`} />
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold">{log.firstname} {log.lastname}</p>
                                  <Badge variant="outline" className="text-[10px] h-4">{log.content_status?.toUpperCase()}</Badge>
                                </div>
                                <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                                {log.draft_link && (
                                  <a 
                                    href={log.draft_link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-sky-600 flex items-center gap-1 hover:underline mt-1"
                                  >
                                    <ExternalLink className="h-3 w-3" /> View Draft Asset
                                  </a>
                                )}
                                {log.notes && <p className="text-xs italic text-slate-400 mt-1">"{log.notes}"</p>}
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="py-12 text-center">
                          <Workflow className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">No content activity recorded for this campaign yet.</p>
                       </div>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Mini Stats/Actions */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-md">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-base uppercase tracking-tighter text-slate-400 font-bold">Budget & Quota</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="flex justify-between items-end border-b pb-4">
                 <div>
                   <p className="text-xs text-slate-500">Maximum Budget</p>
                   <p className="text-2xl font-black text-slate-900">
                     {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(job.budget_max || 0)}
                   </p>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Filled Slots</span>
                   <span className="font-bold">{assignments.length} / {job.quota}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-emerald-500 transition-all" 
                    style={{ width: `${Math.min(100, (assignments.length / (job.quota || 1)) * 100)}%` }} 
                   />
                 </div>
               </div>

               <Button className="w-full bg-slate-900 h-12 text-base" variant="default">
                 <MessageSquare className="mr-2 h-4 w-4" /> Discussion
               </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Platform Targets</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-100">{job.platform_name || 'Instagram'}</Badge>
                  <Badge variant="secondary" className="bg-slate-100">TikTok</Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SUBMIT CONTENT MODAL */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Content Draft</DialogTitle>
            <DialogDescription>
              Submit your Google Drive/Document link for PIC review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link">Draft Link / URL</Label>
              <Input
                id="link"
                placeholder="https://docs.google.com/..."
                value={draftLink}
                onChange={(e) => setDraftLink(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes / Message</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes for the PIC..."
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitContent} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
