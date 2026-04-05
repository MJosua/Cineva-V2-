import React, { useEffect, useState } from 'react';
import { jobMarketplaceService, Batch } from '@/services/jobMarketplaceService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers3, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobMarketplaceBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobMarketplaceService.getBatches();
        setBatches(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">Execution Batches</h1>
        <p className="text-slate-500 mt-1">Timeline and batch groups for campaign execution.</p>
      </div>

      <Card className="border-slate-200 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">All Batches</CardTitle>
              <CardDescription>Master list of operational batches.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 bg-slate-50/50 animate-pulse"></TableCell>
                  </TableRow>
                ))
              ) : batches.length > 0 ? (
                batches.map((batch) => (
                  <TableRow key={batch.batch_id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400">#{batch.batch_id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{batch.batch_name}</TableCell>
                    <TableCell>{batch.campaign_name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                        Batch {batch.batch_order}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium italic">
                    No active batches found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
