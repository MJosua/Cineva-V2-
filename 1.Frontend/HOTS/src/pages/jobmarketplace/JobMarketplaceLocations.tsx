import React, { useEffect, useState } from 'react';
import { jobMarketplaceService, Location } from '@/services/jobMarketplaceService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobMarketplaceLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobMarketplaceService.getLocations();
        setLocations(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">Outlet Locations</h1>
        <p className="text-slate-500 mt-1">Target outlets and campaign visit locations.</p>
      </div>

      <Card className="border-slate-200 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 rounded-lg">
              <MapPin className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Location Directory</CardTitle>
              <CardDescription>Master list of visitable outlets.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Outlet Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Batch Context</TableHead>
                <TableHead className="text-right">Maps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-12 bg-slate-50/50 animate-pulse"></TableCell>
                  </TableRow>
                ))
              ) : locations.length > 0 ? (
                locations.map((loc) => (
                  <TableRow key={loc.location_id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-bold text-slate-900">{loc.outlet_name}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-500 text-xs">{loc.address}</TableCell>
                    <TableCell className="text-xs font-mono">{loc.batch_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {loc.gmaps_url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={loc.gmaps_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4 text-rose-500" />
                          </a>
                        </Button>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium italic">
                    No location data found.
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
