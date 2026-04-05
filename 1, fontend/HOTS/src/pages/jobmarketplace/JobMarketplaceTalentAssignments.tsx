import React, { useEffect, useState } from 'react';
import { jobMarketplaceService, Assignment } from '@/services/jobMarketplaceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Clock, CalendarDays, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobMarketplaceTalentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobMarketplaceService.getAssignments();
        setAssignments(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">Talent Flow</h1>
        <p className="text-slate-500 mt-1">Assignments and talent performance tracking.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)
        ) : assignments.length > 0 ? (
          assignments.map((asn) => (
            <Card key={asn.assignment_id} className="border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{asn.firstname} {asn.lastname}</h3>
                      <p className="text-sm text-slate-500">{asn.campaign_name || 'Global Campaign'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> {asn.status_visit || 'ACTIVE'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 h-10 border-l pl-8 hidden md:block">
                       <p className="text-xs text-slate-400 font-bold uppercase">Job Context</p>
                       <p className="font-medium text-slate-700 truncate max-w-[200px]">{asn.job_title || 'General Activity'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Inspect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No active talent assignments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
