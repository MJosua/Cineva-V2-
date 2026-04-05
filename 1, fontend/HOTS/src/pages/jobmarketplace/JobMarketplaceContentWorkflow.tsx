import React, { useEffect, useState } from 'react';
import { jobMarketplaceService } from '@/services/jobMarketplaceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, ExternalLink, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobMarketplaceContentWorkflow() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobMarketplaceService.getContentLogs();
        setLogs(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">Content Flow</h1>
        <p className="text-slate-500 mt-1">Real-time monitoring of content drafts and approvals.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />)
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.content_log_id} className="border-slate-200">
              <CardHeader className="bg-slate-50/30 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-400">LOG #{log.content_log_id}</span>
                  </div>
                  <Badge variant={log.content_status === 'approved' ? 'default' : 'outline'}>
                    {log.content_status || 'PENDING'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                   <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-bold uppercase">Source Assignment</p>
                      <p className="font-bold">Assignment #{log.assignment_id || '-'}</p>
                   </div>
                   
                   <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-bold uppercase">Assets</p>
                      <div className="flex gap-2">
                        {log.draft_link ? (
                          <Button size="sm" variant="outline" className="h-8" asChild>
                            <a href={log.draft_link} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Draft
                            </a>
                          </Button>
                        ) : <span className="text-xs text-slate-300 italic">No draft yet</span>}
                      </div>
                   </div>

                   <div className="flex justify-end gap-2">
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Review
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Waiting for content submissions...</p>
            <p className="text-xs text-slate-300 mt-1">Logs will appear here once talent starts uploading drafts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
