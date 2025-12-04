// src/pages/dashboard/report/ReportService.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

interface TicketSummary {
  service_name: string;
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
}

export const ReportService: React.FC = () => {
  const [data, setData] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("tokek");
        const res = await axios.get(`${API_URL}/hotsdashboard/report_service`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data.results || []);
      } catch (err) {
        console.error("Error fetching service report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Service Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Service Name</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Open</th>
                <th className="text-right p-2">Closed</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{row.service_name}</td>
                  <td className="text-right p-2">{row.total_tickets}</td>
                  <td className="text-right p-2 text-orange-600">{row.open_tickets}</td>
                  <td className="text-right p-2 text-green-600">{row.closed_tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
